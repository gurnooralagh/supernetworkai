from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import get_client
from app.models.profile import ProfileCreate, ProfileResponse
from app.services.embedding import generate_embedding, store_embedding
from app.routers.match import compute_matches, ComputeRequest

router = APIRouter(prefix="/profile", tags=["profile"])


class ConfirmSummaryRequest(BaseModel):
    profile_summary: str


def _fetch_profile_by_user(user_id: str) -> dict:
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


@router.post("/", response_model=ProfileResponse)
def create_or_update_profile(user_id: str, body: ProfileCreate):
    client = get_client()

    payload = body.model_dump(exclude_none=False)
    payload["user_id"] = user_id

    result = (
        client.table("profiles")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save profile")

    saved = result.data[0]

    try:
        embedding = generate_embedding(saved)
        store_embedding(user_id, embedding)
    except Exception:
        pass

    return saved


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str):
    return _fetch_profile_by_user(user_id)


@router.post("/{user_id}/confirm-summary")
def confirm_summary(user_id: str, body: ConfirmSummaryRequest):
    client = get_client()

    result = (
        client.table("profiles")
        .update({
            "profile_summary": body.profile_summary,
            "profile_summary_confirmed": True,
        })
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found or update failed")

    updated_profile = result.data[0]

    try:
        embedding = generate_embedding(updated_profile)
        store_embedding(user_id, embedding)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

    try:
        compute_matches(ComputeRequest(current_user_id=user_id))
    except Exception:
        pass

    return {"confirmed": True}


@router.post("/{user_id}/embed")
def embed_profile(user_id: str):
    profile = _fetch_profile_by_user(user_id)

    try:
        embedding = generate_embedding(profile)
        store_embedding(user_id, embedding)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

    return {"embedded": True}
