"""
Pydantic schemas for pet customization.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Literal
from uuid import UUID
from uuid import uuid4

from pydantic import BaseModel, Field, validator

from app.models.pet import BREED_OPTIONS, SpeciesEnum


class PetDiaryEntry(BaseModel):
    """
    Represents a single diary entry describing a pet interaction.
    """

    timestamp: datetime
    action: str
    description: str
    delta: dict[str, int]


class PetStats(BaseModel):
    """
    Encapsulates pet stats for easier reuse.
    """

    hunger: int = Field(..., ge=0, le=100)
    happiness: int = Field(..., ge=0, le=100)
    cleanliness: int = Field(..., ge=0, le=100)
    energy: int = Field(..., ge=0, le=100)
    health: int = Field(..., ge=0, le=100)
    mood: str


class FeedPetRequest(BaseModel):
    """
    Payload for feeding a pet. The food_type drives stat modifiers.
    """

    food_type: str = Field(..., min_length=3, max_length=30)


class PlayPetRequest(BaseModel):
    """
    Payload for playing with a pet. The game_type determines boosts.
    """

    game_type: str = Field(..., min_length=3, max_length=30)


class RestPetRequest(BaseModel):
    """
    Payload for resting/sleeping a pet. Duration controls recovery.
    """

    duration_hours: int = Field(..., ge=1, le=12)


class PetInteractRequest(BaseModel):
    """
    Combined payload for generic pet interactions.
    """

    session_id: Optional[str] = Field(
        default=None,
        description="Shared across AI chat and pet interactions for contextual memory.",
        max_length=128,
    )
    action: str = Field(..., min_length=2, max_length=30)
    message: Optional[str] = Field(
        default=None, max_length=500, description="Additional natural language context."
    )
    original_prompt: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Raw command typed by the user (for memory playback).",
    )
    food_type: Optional[str] = Field(default=None, min_length=3, max_length=30)
    game_type: Optional[str] = Field(default=None, min_length=3, max_length=30)
    duration_hours: Optional[int] = Field(default=1, ge=1, le=12)

    def ensure_session_id(self) -> str:
        """
        Guarantee the presence of a session identifier shared with the chat endpoint.
        """

        if self.session_id:
            return self.session_id
        new_id = uuid4().hex
        self.session_id = new_id
        return new_id

    def normalized_action(self) -> str:
        """
        Normalize the requested action to simplify downstream dispatch.
        """

        return self.action.strip().lower()


class PetBase(BaseModel):
    """
    Shared fields across pet schemas.
    """

    name: str = Field(..., max_length=50)
    species: SpeciesEnum
    breed: str = Field(..., max_length=50)
    color_pattern: str = Field(..., max_length=50)
    birthday: date

    @validator("breed")
    def validate_breed(cls, value: str, values):
        """
        Ensure the breed matches the selected species.
        """

        species = values.get("species")
        if species is None:
            return value
        allowed = BREED_OPTIONS.get(species, [])
        if allowed and value not in allowed:
            raise ValueError(f"Breed '{value}' is not available for species '{species.value}'.")
        return value


class PetCreate(PetBase):
    """
    Schema for pet creation requests.
    """

    pass


class PetUpdate(BaseModel):
    """
    Schema for pet updates. All fields are optional.
    """

    name: Optional[str] = Field(None, max_length=50)
    species: Optional[SpeciesEnum] = None
    breed: Optional[str] = Field(None, max_length=50)
    color_pattern: Optional[str] = Field(None, max_length=50)
    birthday: Optional[date] = None

    @validator("breed")
    def validate_breed_for_update(cls, value: Optional[str], values):
        species = values.get("species")
        if value is None or species is None:
            return value
        allowed = BREED_OPTIONS.get(species, [])
        if allowed and value not in allowed:
            raise ValueError(f"Breed '{value}' is not available for species '{species.value}'.")
        return value

    def dict(self, *args, **kwargs):
        kwargs.setdefault("exclude_unset", True)
        return super().dict(*args, **kwargs)


class PetRead(PetBase):
    """
    Representation of a pet returned to API clients.
    """

    id: UUID
    user_id: UUID
    hunger: int = Field(..., ge=0, le=100, exclude=True)
    happiness: int = Field(..., ge=0, le=100, exclude=True)
    cleanliness: int = Field(..., ge=0, le=100, exclude=True)
    energy: int = Field(..., ge=0, le=100, exclude=True)
    health: int = Field(..., ge=0, le=100, exclude=True)
    mood: str = Field(default="happy", exclude=True)
    last_fed: Optional[datetime] = Field(default=None, exclude=True)
    last_played: Optional[datetime] = Field(default=None, exclude=True)
    last_bathed: Optional[datetime] = Field(default=None, exclude=True)
    last_slept: Optional[datetime] = Field(default=None, exclude=True)
    stats: PetStats
    created_at: datetime
    updated_at: datetime
    age: int = Field(..., description="Age in full years computed from birthday.")
    diary: List[PetDiaryEntry] = Field(default_factory=list)

    class Config:
        orm_mode = True

    @validator("age", pre=True, always=True)
    def compute_age(cls, value, values):
        birthday: date = values.get("birthday") or date.today()
        today = datetime.utcnow().date()
        age = today.year - birthday.year
        if (today.month, today.day) < (birthday.month, birthday.day):
            age -= 1
        return max(age, 0)

    @validator("stats", pre=True, always=True)
    def assemble_stats(cls, value, values):
        if isinstance(value, PetStats):
            return value
        data = {
            "hunger": values.get("hunger"),
            "happiness": values.get("happiness"),
            "cleanliness": values.get("cleanliness"),
            "energy": values.get("energy"),
            "health": values.get("health"),
            "mood": values.get("mood") or "happy",
        }
        return PetStats(**data)

    @validator("diary", pre=True, always=True)
    def ensure_diary(cls, value):
        if not value:
            return []
        return [PetDiaryEntry(**entry) for entry in value]


class PetActionResponse(BaseModel):
    """
    Response returned after performing a pet interaction.
    """

    pet: PetRead
    reaction: str


class PetNotification(BaseModel):
    """
    AI-generated notification describing important pet events or warnings.
    """

    stat: Optional[str]
    severity: Literal["info", "warning", "critical"]
    message: str
    urgency: Literal["low", "medium", "high"]


class PetAIInsights(BaseModel):
    """
    Aggregated AI insights used by the Pet AI dashboard.
    """

    mood: str
    mood_label: str
    mood_score: float
    personality_traits: List[str]
    personality_summary: str
    help_suggestions: List[str]
    predicted_health: str
    health_risk_level: Literal["low", "medium", "high"]
    health_factors: List[str]
    recommended_difficulty: str
    care_style: str
    notifications: List[PetNotification]
    recommended_actions: List[str]


class PetCommandRequest(BaseModel):
    """
    Natural language command submitted by the user.
    """

    command_text: str = Field(..., min_length=1, max_length=200)


class PetCommandResponse(BaseModel):
    """
    Parsed intent result from the AI command parser stub.
    """

    action: Optional[str]
    parameters: dict[str, str]
    confidence: float = Field(..., ge=0.0, le=1.0)
    note: str


class PetHelpResponse(BaseModel):
    """
    AI-driven help suggestions for caring for the pet.
    """

    suggestions: List[str]


class PetHealthSummary(BaseModel):
    """
    Lightweight AI health summary returned by the health check action.
    """

    summary: str
    mood: str


class PetCommandAIRequest(BaseModel):
    """
    Natural language command request for pet actions.
    
    Supports single and multi-step commands like:
    - "feed my pet"
    - "play fetch then let my pet sleep"
    - "bathe my pet and then feed it a treat"
    """

    command: str = Field(..., min_length=1, max_length=500, description="Natural language command for pet action(s)")
    session_id: Optional[str] = Field(
        default=None,
        max_length=128,
        description="Optional session ID for maintaining context across commands",
    )


class PetCommandStepResult(BaseModel):
    """
    Result of executing a single command step.
    """

    action: str = Field(..., description="The action that was executed")
    success: bool = Field(..., description="Whether the action succeeded")
    message: str = Field(..., description="Pet's reaction or result message")
    stat_changes: Optional[Dict[str, int]] = Field(
        default=None,
        description="Changes to pet stats (hunger, happiness, energy, etc.)",
    )
    pet_state: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Current pet state after action",
    )


class PetCommandAIResponse(BaseModel):
    """
    Structured response from pet command AI endpoint.
    
    Includes:
    - Execution results for each step
    - Success status
    - Suggestions for next actions
    - Confidence score
    - Fail-safe fallback when command cannot be understood
    """

    success: bool = Field(..., description="Overall success of command execution")
    message: str = Field(..., description="Summary message about the execution")
    suggestions: List[str] = Field(
        default_factory=list,
        description="Contextual suggestions for next actions or command improvements",
    )
    results: List[PetCommandStepResult] = Field(
        default_factory=list,
        description="Results for each executed step (empty if command was invalid)",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for command parsing (0.0 = invalid, 1.0 = high confidence)",
    )
    original_command: str = Field(..., description="The original command that was processed")
    steps_executed: int = Field(
        default=0,
        ge=0,
        description="Number of command steps that were executed",
    )

