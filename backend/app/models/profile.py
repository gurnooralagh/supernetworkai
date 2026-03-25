from pydantic import BaseModel
from typing import Optional
import uuid


class ProfileCreate(BaseModel):
    # Basic info
    name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = None

    # Intent
    intent: Optional[str] = None

    # Ikigai
    ikigai_passion_1: Optional[str] = None
    ikigai_passion_2: Optional[str] = None
    ikigai_strength_1: Optional[str] = None
    ikigai_strength_2: Optional[str] = None
    ikigai_mission_1: Optional[str] = None
    ikigai_mission_2: Optional[str] = None
    ikigai_vocation_1: Optional[str] = None
    ikigai_vocation_2: Optional[str] = None

    # Collaboration fit
    collaboration_fit_1: Optional[str] = None
    collaboration_fit_2: Optional[str] = None
    collaboration_fit_3: Optional[str] = None

    # Portfolio deep dive
    portfolio_what: Optional[str] = None
    portfolio_why: Optional[str] = None
    portfolio_knew: Optional[str] = None
    portfolio_assumptions: Optional[str] = None
    portfolio_start: Optional[str] = None
    portfolio_role: Optional[str] = None
    portfolio_decision: Optional[str] = None
    portfolio_differently: Optional[str] = None
    portfolio_learning: Optional[str] = None
    portfolio_thinking: Optional[str] = None
    portfolio_pressure: Optional[str] = None

    # Profile summary
    profile_summary: Optional[str] = None
    profile_summary_confirmed: Optional[bool] = False

    # Skills, goals, contact
    skills: Optional[list[str]] = []
    goals: Optional[list[str]] = []
    contact_visibility: Optional[str] = "after_connect"
    working_style: Optional[str] = None
    availability: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    contact_email: Optional[str] = None


class ProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID

    # Basic info
    name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = None

    # Intent
    intent: Optional[str] = None

    # Ikigai
    ikigai_passion_1: Optional[str] = None
    ikigai_passion_2: Optional[str] = None
    ikigai_strength_1: Optional[str] = None
    ikigai_strength_2: Optional[str] = None
    ikigai_mission_1: Optional[str] = None
    ikigai_mission_2: Optional[str] = None
    ikigai_vocation_1: Optional[str] = None
    ikigai_vocation_2: Optional[str] = None

    # Collaboration fit
    collaboration_fit_1: Optional[str] = None
    collaboration_fit_2: Optional[str] = None
    collaboration_fit_3: Optional[str] = None

    # Portfolio deep dive
    portfolio_what: Optional[str] = None
    portfolio_why: Optional[str] = None
    portfolio_knew: Optional[str] = None
    portfolio_assumptions: Optional[str] = None
    portfolio_start: Optional[str] = None
    portfolio_role: Optional[str] = None
    portfolio_decision: Optional[str] = None
    portfolio_differently: Optional[str] = None
    portfolio_learning: Optional[str] = None
    portfolio_thinking: Optional[str] = None
    portfolio_pressure: Optional[str] = None

    # Profile summary
    profile_summary: Optional[str] = None
    profile_summary_confirmed: Optional[bool] = False

    # Skills, goals, contact
    skills: Optional[list[str]] = []
    goals: Optional[list[str]] = []
    contact_visibility: Optional[str] = None
    working_style: Optional[str] = None
    availability: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    # contact_email intentionally excluded — never returned by public API

    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
