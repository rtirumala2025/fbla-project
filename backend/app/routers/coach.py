"""Coach API endpoints for pet care advice."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.models import AuthenticatedUser
from app.utils.dependencies import get_current_user, get_db_pool

router = APIRouter(prefix="/coach", tags=["coach"])


class CoachSuggestion(BaseModel):
    category: str
    recommendation: str


class CoachAdviceResponse(BaseModel):
    mood: str
    difficulty_hint: str
    summary: str
    suggestions: List[CoachSuggestion]
    generated_at: str
    source: str


@router.get("/advice", response_model=CoachAdviceResponse, summary="Get personalized pet care advice")
async def get_advice(
    current_user: AuthenticatedUser = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> CoachAdviceResponse:
    """
    Get personalized advice based on pet stats, recent activity, and financial situation.
    Uses heuristics for now, can be extended with AI in the future.
    """
    suggestions = []
    mood = "happy"
    difficulty_hint = "normal"
    summary = "Your pet is doing great! Keep up the excellent care."
    
    async with pool.acquire() as conn:
        # Get pet stats
        pet = await conn.fetchrow(
            """
            SELECT name, health, hunger, happiness, cleanliness, energy
            FROM pets
            WHERE user_id = $1
            """,
            current_user.id,
        )
        
        # Get wallet balance
        wallet = await conn.fetchrow(
            """
            SELECT balance
            FROM finance_wallets
            WHERE user_id = $1
            """,
            current_user.id,
        )
        
        # Get recent quests
        active_quests = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM user_quests
            WHERE user_id = $1 AND status = 'in_progress'
            """,
            current_user.id,
        )
    
    if pet:
        # Analyze pet stats and generate suggestions
        if pet["hunger"] and pet["hunger"] < 50:
            suggestions.append(CoachSuggestion(
                category="care",
                recommendation=f"Your pet is hungry (Hunger: {pet['hunger']}%). Feed them soon!"
            ))
            mood = "hungry"
        
        if pet["energy"] and pet["energy"] < 30:
            suggestions.append(CoachSuggestion(
                category="care",
                recommendation=f"Your pet is tired (Energy: {pet['energy']}%). Let them rest."
            ))
            mood = "tired"
        
        if pet["happiness"] and pet["happiness"] < 50:
            suggestions.append(CoachSuggestion(
                category="activity",
                recommendation=f"Your pet seems sad (Happiness: {pet['happiness']}%). Play with them!"
            ))
            mood = "sad"
        
        if pet["cleanliness"] and pet["cleanliness"] < 40:
            suggestions.append(CoachSuggestion(
                category="care",
                recommendation=f"Your pet needs a bath (Cleanliness: {pet['cleanliness']}%)."
            ))
        
        if pet["health"] and pet["health"] < 60:
            suggestions.append(CoachSuggestion(
                category="care",
                recommendation=f"Consider a vet visit (Health: {pet['health']}%)."
            ))
            difficulty_hint = "easy"
        
        # Generate summary based on overall status
        avg_stats = sum([
            pet["health"] or 50,
            pet["hunger"] or 50,
            pet["happiness"] or 50,
            pet["cleanliness"] or 50,
            pet["energy"] or 50,
        ]) / 5
        
        if avg_stats >= 80:
            summary = f"{pet['name']} is thriving! All stats are looking great."
            mood = "happy"
        elif avg_stats >= 60:
            summary = f"{pet['name']} is doing okay, but could use some attention."
        else:
            summary = f"{pet['name']} needs your care! Focus on the suggestions below."
    else:
        suggestions.append(CoachSuggestion(
            category="getting_started",
            recommendation="Create your first pet to start receiving personalized advice!"
        ))
        summary = "Welcome! Create a pet to get started."
    
    # Financial suggestions
    if wallet:
        if wallet["balance"] < 20:
            suggestions.append(CoachSuggestion(
                category="finance",
                recommendation="Low on coins! Complete quests or play games to earn more."
            ))
    
    # Quest suggestions
    if active_quests and active_quests > 0:
        suggestions.append(CoachSuggestion(
            category="quest",
            recommendation=f"You have {active_quests} active quest(s). Complete them for rewards!"
        ))
    else:
        suggestions.append(CoachSuggestion(
            category="quest",
            recommendation="Check out new daily quests for bonus rewards."
        ))
    
    # Add motivational suggestion if everything is good
    if len(suggestions) == 1:  # Only the quest suggestion
        suggestions.append(CoachSuggestion(
            category="motivation",
            recommendation="You're an amazing pet parent! Keep up the great work!"
        ))
    
    return CoachAdviceResponse(
        mood=mood,
        difficulty_hint=difficulty_hint,
        summary=summary,
        suggestions=suggestions,
        generated_at=datetime.now(timezone.utc).isoformat(),
        source="heuristic",
    )
