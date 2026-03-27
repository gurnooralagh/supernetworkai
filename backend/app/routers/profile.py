from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.database import get_client
from app.models.profile import ProfileCreate, ProfileResponse
from app.services.embedding import generate_embedding, store_embedding
from app.services.groq_service import generate_profile_summary
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


def _post_confirm_tasks(user_id: str, profile: dict) -> None:
    try:
        embedding = generate_embedding(profile)
        store_embedding(user_id, embedding)
    except Exception:
        pass
    try:
        compute_matches(ComputeRequest(current_user_id=user_id))
    except Exception:
        pass


@router.post("/{user_id}/confirm-summary")
def confirm_summary(user_id: str, body: ConfirmSummaryRequest, background_tasks: BackgroundTasks):
    client = get_client()

    summary = body.profile_summary
    # Empty summary = auto-generate call (user hasn't confirmed yet)
    is_confirming = bool(summary)

    if not summary:
        profile = _fetch_profile_by_user(user_id)
        summary = generate_profile_summary(profile)

    update_payload: dict = {"profile_summary": summary}
    if is_confirming:
        update_payload["profile_summary_confirmed"] = True

    result = (
        client.table("profiles")
        .update(update_payload)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found or update failed")

    # Fire embedding + matching in background so response returns immediately
    if is_confirming:
        background_tasks.add_task(_post_confirm_tasks, user_id, result.data[0])

    return {"confirmed": is_confirming, "profile_summary": summary}


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
