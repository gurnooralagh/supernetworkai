from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import get_client
from app.services.embedding import generate_query_embedding
from app.services.groq_service import rank_matches, _score_candidate

router = APIRouter(prefix="/match", tags=["match"])

TOP_K = 20


class ComputeRequest(BaseModel):
    current_user_id: str


class SearchRequest(BaseModel):
    current_user_id: str
    search_query: str


class ScorePairRequest(BaseModel):
    current_user_id: str
    target_user_id: str


def _fetch_profile(user_id: str) -> dict:
    client = get_client()
    result = (
        client.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data


def _fetch_other_profiles(user_id: str) -> list[dict]:
    client = get_client()
    result = (
        client.table("profiles")
        .select("*")
        .neq("user_id", user_id)
        .execute()
    )
    return result.data or []


def _vector_search(
    embedding: list[float],
    exclude_user_id: str,
    limit: int = TOP_K,
    min_similarity: float | None = None,
) -> list[dict]:
    client = get_client()
    rpc_result = client.rpc(
        "match_profiles",
        {
            "query_embedding": embedding,
            "exclude_user_id": exclude_user_id,
            "match_count": limit,
        },
    ).execute()
    rows = rpc_result.data or []
    if not rows:
        return []

    # Optionally filter by minimum similarity score
    if min_similarity is not None:
        rows = [r for r in rows if r.get("similarity", 0) >= min_similarity]
    if not rows:
        return []

    # Preserve similarity ranking order
    similarity_rank = {r["user_id"]: i for i, r in enumerate(rows)}
    user_ids = [r["user_id"] for r in rows]
    profiles_result = (
        client.table("profiles")
        .select("*")
        .in_("user_id", user_ids)
        .execute()
    )
    profiles = profiles_result.data or []
    profiles.sort(key=lambda p: similarity_rank.get(p["user_id"], 999))
    return profiles


def _store_matches(current_user_id: str, matches: list[dict]) -> None:
    client = get_client()
    rows = [
        {
            "user_id": current_user_id,
            "matched_user_id": m["matched_user_id"],
            "cofounder_score": m["cofounder_score"],
            "teammate_score": m["teammate_score"],
            "top_management_score": m["top_management_score"],
            "best_category": m["best_category"],
            "overall_score": m["overall_score"],
            "explanation": m.get("explanation"),
            "source": "auto",
        }
        for m in matches
    ]
    if rows:
        client.table("matches").upsert(rows, on_conflict="user_id,matched_user_id").execute()


@router.post("/compute")
def compute_matches(body: ComputeRequest):
    current_profile = _fetch_profile(body.current_user_id)

    embedding = current_profile.get("embedding")
    if not embedding:
        raise HTTPException(status_code=400, detail="Current user has no embedding. Run /profile/embed first.")

    candidates = _vector_search(embedding, body.current_user_id)
    if not candidates:
        candidates = _fetch_other_profiles(body.current_user_id)

    ranked = rank_matches(current_profile, candidates)
    _store_matches(body.current_user_id, ranked)

    return {"matches": ranked}


@router.post("/search")
def search_matches(body: SearchRequest):
    current_profile = _fetch_profile(body.current_user_id)

    query_embedding = generate_query_embedding(body.search_query)
    candidates = _vector_search(query_embedding, body.current_user_id)
    if not candidates:
        candidates = _fetch_other_profiles(body.current_user_id)

    ranked = rank_matches(current_profile, candidates, search_query=body.search_query)

    return ranked


@router.post("/search-profiles")
def search_profiles(body: SearchRequest):
    """Vector search only — no Groq scoring. Returns profiles ordered by embedding similarity."""
    query_embedding = generate_query_embedding(body.search_query)
    return _vector_search(query_embedding, body.current_user_id, min_similarity=0.35)


@router.post("/score-pair")
def score_pair(body: ScorePairRequest):
    """Score compatibility between exactly two users using Groq. Fast single call."""
    current_profile = _fetch_profile(body.current_user_id)
    target_profile = _fetch_profile(body.target_user_id)

    result = _score_candidate(current_profile, target_profile, search_query=None)
    if result is None:
        raise HTTPException(status_code=500, detail="Scoring failed")
    return result
