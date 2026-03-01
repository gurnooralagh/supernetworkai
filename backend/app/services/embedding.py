import os
from openai import OpenAI
from app.database import get_client

_openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

PROFILE_FIELDS = [
    "name",
    "headline",
    "bio",
    "intent",
    "skills",
    "ikigai_passion_1",
    "ikigai_passion_2",
    "ikigai_strength_1",
    "ikigai_strength_2",
    "ikigai_mission_1",
    "ikigai_mission_2",
    "ikigai_vocation_1",
    "ikigai_vocation_2",
    "collaboration_fit_1",
    "collaboration_fit_2",
    "collaboration_fit_3",
    "portfolio_what",
    "portfolio_why",
    "portfolio_knew",
    "portfolio_assumptions",
    "portfolio_start",
    "portfolio_role",
    "portfolio_decision",
    "portfolio_differently",
    "portfolio_learning",
    "portfolio_thinking",
    "portfolio_pressure",
    "profile_summary",
]


def build_profile_text(profile: dict) -> str:
    parts = []
    for field in PROFILE_FIELDS:
        value = profile.get(field)
        if not value:
            continue
        if isinstance(value, list):
            joined = ", ".join(v for v in value if v)
            if joined:
                parts.append(joined)
        else:
            parts.append(str(value))
    return " ".join(parts)


def generate_embedding(profile: dict) -> list[float]:
    text = build_profile_text(profile)
    if not text.strip():
        raise ValueError("Profile has no content to embed.")

    response = _openai.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def generate_query_embedding(query: str) -> list[float]:
    if not query.strip():
        raise ValueError("Query is empty.")
    response = _openai.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    return response.data[0].embedding


def store_embedding(user_id: str, embedding: list[float]) -> None:
    client = get_client()
    result = (
        client.table("profiles")
        .update({"embedding": embedding})
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise RuntimeError(f"Failed to store embedding for user_id={user_id}")
