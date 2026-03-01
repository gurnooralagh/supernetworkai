from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import get_client
from app.services.groq_service import rank_matches
from app.services.resend_service import send_connection_email

router = APIRouter(prefix="/connect", tags=["connect"])


class ConnectRequest(BaseModel):
    requester_id: str
    receiver_id: str
    personal_message: str


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
        raise HTTPException(status_code=404, detail=f"Profile not found for user_id={user_id}")
    return result.data


def _fetch_match_data(requester_id: str, receiver_id: str) -> dict | None:
    client = get_client()
    result = (
        client.table("matches")
        .select("*")
        .eq("user_id", requester_id)
        .eq("matched_user_id", receiver_id)
        .single()
        .execute()
    )
    return result.data or None


def _save_connection(requester_id: str, receiver_id: str, message: str) -> None:
    client = get_client()
    client.table("connections").upsert(
        {
            "requester_id": requester_id,
            "recipient_id": receiver_id,
            "status": "pending",
            "message": message,
        },
        on_conflict="requester_id,recipient_id",
    ).execute()


def _log_event(requester_id: str, receiver_id: str) -> None:
    client = get_client()
    client.table("user_events").insert(
        {
            "user_id": requester_id,
            "event_type": "connect_attempt",
            "target_id": receiver_id,
        }
    ).execute()


@router.post("/")
def send_connect(body: ConnectRequest):
    try:
        requester_profile = _fetch_profile(body.requester_id)
    except HTTPException:
        return {"success": False, "reason": "Requester profile not found"}

    try:
        receiver_profile = _fetch_profile(body.receiver_id)
    except HTTPException:
        return {"success": False, "reason": "Receiver profile not found"}

    match_data = _fetch_match_data(body.requester_id, body.receiver_id)

    if not match_data:
        ranked = rank_matches(requester_profile, [receiver_profile])
        if ranked:
            match_data = ranked[0]
        else:
            match_data = {
                "overall_score": 0,
                "best_category": "teammate",
                "cofounder_score": None,
                "teammate_score": None,
                "top_management_score": None,
                "explanation": None,
            }

    email_sent = send_connection_email(
        sender_profile=requester_profile,
        receiver_profile=receiver_profile,
        match_data=match_data,
        personal_message=body.personal_message,
    )

    try:
        _save_connection(body.requester_id, body.receiver_id, body.personal_message)
    except Exception:
        pass

    try:
        _log_event(body.requester_id, body.receiver_id)
    except Exception:
        pass

    if email_sent:
        return {"success": True}
    else:
        return {"success": False, "reason": "Failed to send email. Check receiver contact email and Resend configuration."}
