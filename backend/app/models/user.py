"""Domain models representing persistent user state."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: str
    email: str
    display_name: str | None
    created_at: datetime
