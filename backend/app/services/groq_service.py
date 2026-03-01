import os
import json
from groq import Groq

_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

REQUIRED_FIELDS = {"cofounder", "teammate", "top_management", "best_category", "overall_score"}
REQUIRED_CATEGORY_FIELDS = {"score", "reason"}
VALID_CATEGORIES = {"cofounder", "teammate", "top_management"}


def _format_profile(profile: dict) -> str:
    fields = [
        ("Name", profile.get("name")),
        ("Headline", profile.get("headline")),
        ("Bio", profile.get("bio")),
        ("Intent", profile.get("intent")),
        ("Skills", ", ".join(profile.get("skills") or [])),
        ("Goals", ", ".join(profile.get("goals") or [])),
        ("Passion (1)", profile.get("ikigai_passion_1")),
        ("Passion (2)", profile.get("ikigai_passion_2")),
        ("Strength (1)", profile.get("ikigai_strength_1")),
        ("Strength (2)", profile.get("ikigai_strength_2")),
        ("Mission (1)", profile.get("ikigai_mission_1")),
        ("Mission (2)", profile.get("ikigai_mission_2")),
        ("Vocation (1)", profile.get("ikigai_vocation_1")),
        ("Vocation (2)", profile.get("ikigai_vocation_2")),
        ("Collaboration fit (1)", profile.get("collaboration_fit_1")),
        ("Collaboration fit (2)", profile.get("collaboration_fit_2")),
        ("Collaboration fit (3)", profile.get("collaboration_fit_3")),
        ("Portfolio — what they built", profile.get("portfolio_what")),
        ("Portfolio — why it mattered", profile.get("portfolio_why")),
        ("Portfolio — what they knew/didn't know", profile.get("portfolio_knew")),
        ("Portfolio — wrong assumptions", profile.get("portfolio_assumptions")),
        ("Portfolio — how they started", profile.get("portfolio_start")),
        ("Portfolio — their role", profile.get("portfolio_role")),
        ("Portfolio — hardest decision", profile.get("portfolio_decision")),
        ("Portfolio — what they'd do differently", profile.get("portfolio_differently")),
        ("Portfolio — biggest learning", profile.get("portfolio_learning")),
        ("Portfolio — how it changed their thinking", profile.get("portfolio_thinking")),
        ("Portfolio — how they work under pressure", profile.get("portfolio_pressure")),
        ("Profile summary", profile.get("profile_summary")),
    ]
    lines = [f"{label}: {value}" for label, value in fields if value]
    return "\n".join(lines)


def _build_prompt(current_user: dict, candidate: dict, search_query: str | None) -> str:
    profile_a = _format_profile(current_user)
    profile_b = _format_profile(candidate)
    query_line = search_query if search_query else "none"

    return f"""You are an expert startup matchmaking engine.
Score compatibility between two people using these weights:
- Semantic similarity (how aligned their profiles, goals, values are): 60%
- Intent compatibility (are they looking for complementary things?): 25%
- Skills and interest overlap: 15%

For each role, produce a score weighted by the above dimensions.
If a search query is provided, prioritize relevance to that query.

Return JSON only, no preamble:
{{
  "cofounder": {{ "score": 0-100, "reason": "2 sentences" }},
  "teammate": {{ "score": 0-100, "reason": "2 sentences" }},
  "top_management": {{ "score": 0-100, "reason": "2 sentences" }},
  "best_category": "cofounder|teammate|top_management",
  "overall_score": 0-100
}}

Profile A (current user):
{profile_a}

Profile B (candidate):
{profile_b}

Search query (if any): {query_line}

When scoring, pay special attention to portfolio answers.
Two people who think similarly, reflect deeply, and complement each other in execution style are stronger matches than two people who merely share the same skills or industry."""


def _validate_response(data: dict) -> bool:
    if not REQUIRED_FIELDS.issubset(data.keys()):
        return False
    for category in ("cofounder", "teammate", "top_management"):
        cat = data.get(category)
        if not isinstance(cat, dict):
            return False
        if not REQUIRED_CATEGORY_FIELDS.issubset(cat.keys()):
            return False
        score = cat.get("score")
        if not isinstance(score, (int, float)) or not (0 <= score <= 100):
            return False
    if data.get("best_category") not in VALID_CATEGORIES:
        return False
    overall = data.get("overall_score")
    if not isinstance(overall, (int, float)) or not (0 <= overall <= 100):
        return False
    return True


def _score_candidate(current_user: dict, candidate: dict, search_query: str | None) -> dict | None:
    prompt = _build_prompt(current_user, candidate, search_query)
    try:
        response = _groq.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        data = json.loads(raw)

        if not _validate_response(data):
            return None

        return {
            "user_id": candidate.get("user_id"),
            "matched_user_id": candidate.get("user_id"),
            "cofounder_score": float(data["cofounder"]["score"]),
            "teammate_score": float(data["teammate"]["score"]),
            "top_management_score": float(data["top_management"]["score"]),
            "best_category": data["best_category"],
            "overall_score": float(data["overall_score"]),
            "explanation": (
                data[data["best_category"]]["reason"]
                if data["best_category"] in data
                else None
            ),
            "profile": candidate,
        }
    except Exception:
        return None


def rank_matches(
    current_user_profile: dict,
    candidate_profiles: list[dict],
    search_query: str | None = None,
) -> list[dict]:
    results = []
    for candidate in candidate_profiles:
        scored = _score_candidate(current_user_profile, candidate, search_query)
        if scored is not None:
            results.append(scored)

    results.sort(key=lambda x: x["overall_score"], reverse=True)
    return results
