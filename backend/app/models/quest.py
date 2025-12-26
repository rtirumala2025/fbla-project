"""Domain models for quest system."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional


class QuestType(str, Enum):
    """Quest type enumeration."""
    DAILY = "daily"
    WEEKLY = "weekly"
    EVENT = "event"


class QuestDifficulty(str, Enum):
    """Quest difficulty enumeration."""
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"
    HEROIC = "heroic"


class QuestStatus(str, Enum):
    """Quest status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLAIMED = "claimed"


@dataclass
class Quest:
    """Represents a quest definition in the catalog."""
    
    id: str
    quest_key: str
    description: str
    quest_type: QuestType
    difficulty: QuestDifficulty
    rewards: Dict[str, Any]  # JSONB: {"coins": int, "xp": int, "items": List[str]}
    target_value: int
    icon: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def is_active(self, now: datetime) -> bool:
        """Return True if the quest is currently active."""
        if self.start_at and self.start_at > now:
            return False
        if self.end_at and self.end_at < now:
            return False
        return True


@dataclass
class UserQuest:
    """Represents a user's progress on a specific quest."""
    
    id: str
    user_id: str
    quest_id: str
    status: QuestStatus
    progress: int
    target_value: int
    last_progress_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    claimed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def is_complete(self) -> bool:
        """Return True if progress has reached or exceeded target."""
        return self.progress >= self.target_value
    
    def is_claimable(self) -> bool:
        """Return True if quest is completed but not yet claimed."""
        return self.status == QuestStatus.COMPLETED
    
    def progress_percentage(self) -> float:
        """Return progress as a percentage (0-100)."""
        if self.target_value == 0:
            return 100.0
        return min(100.0, (self.progress / self.target_value) * 100.0)
