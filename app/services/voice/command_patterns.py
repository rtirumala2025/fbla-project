"""
Command patterns and constants for voice command recognition.

Enhanced with synonyms and pronunciation variations for improved accuracy.
"""
from __future__ import annotations

from typing import Dict, List, Tuple

# Command patterns with enhanced synonyms and variations
COMMAND_PATTERNS: Dict[str, List[Tuple[str, str]]] = {
    "feed": [
        # Specific patterns (higher confidence)
        (r"\b(feed|give|offer|provide|serve)\s+(?:my\s+)?(?:pet|dog|cat|bird|rabbit|companion|friend)\s+(?:a\s+)?(?:some\s+)?", "feed"),
        (r"\b(feed|give|treat|snack|food|meal|dinner|breakfast|lunch|eat)\b", "feed"),
        (r"\b(hungry|hunger|starving|famished|feed|eating)\b", "feed"),
        # Pronunciation variations
        (r"\b(fed|feeding|feeds)\b", "feed"),
        (r"\b(give\s+food|give\s+treat|give\s+meal)\b", "feed"),
    ],
    "play": [
        # Specific patterns
        (r"\b(play|game|fetch|tug|toy|fun|entertain|exercise)\s+(?:with\s+)?(?:my\s+)?(?:pet|dog|cat|bird|rabbit|companion)\b", "play"),
        (r"\b(play|game|fetch|tug|toy|fun|entertain|exercise|activity)\b", "play"),
        (r"\b(entertain|exercise|activity|interact|engage)\b", "play"),
        # Variations
        (r"\b(playing|played|plays)\b", "play"),
        (r"\b(play\s+with|play\s+game|play\s+toy)\b", "play"),
    ],
    "sleep": [
        # Specific patterns
        (r"\b(sleep|rest|nap|bedtime|sleepy|tired|energy|recharge)\s+(?:my\s+)?(?:pet|dog|cat|bird|rabbit|companion)\b", "sleep"),
        (r"\b(sleep|rest|nap|bedtime|sleepy|tired|recharge|recover|relax)\b", "sleep"),
        (r"\b(recharge|recover|relax|rest|slumber)\b", "sleep"),
        # Variations
        (r"\b(sleeping|slept|sleeps|resting|rested)\b", "sleep"),
        (r"\b(go\s+to\s+sleep|put\s+to\s+bed|let\s+rest)\b", "sleep"),
    ],
    "bathe": [
        # Specific patterns
        (r"\b(bathe|bath|clean|wash|groom|shower|hygiene)\s+(?:my\s+)?(?:pet|dog|cat|bird|rabbit|companion)\b", "bathe"),
        (r"\b(bathe|bath|clean|wash|groom|shower|hygiene|cleanliness|fresh)\b", "bathe"),
        (r"\b(hygiene|cleanliness|fresh|clean|washing)\b", "bathe"),
        # Variations
        (r"\b(bathing|bathed|baths|cleaning|cleaned|washing|washed)\b", "bathe"),
        (r"\b(give\s+bath|take\s+bath|clean\s+up)\b", "bathe"),
    ],
    "trick": [
        # Specific patterns
        (r"\b(trick|perform|show|do|demonstrate)\s+(?:a\s+)?(?:trick|command|skill)\b", "trick"),
        (r"\b(sit|stay|roll|shake|speak|fetch|down|up|come|heel)\b", "trick"),
        (r"\b(learn|teach|train|practice|command)\b", "trick"),
        # Variations
        (r"\b(tricks|performing|training|commands)\b", "trick"),
        (r"\b(do\s+trick|perform\s+trick|show\s+trick)\b", "trick"),
    ],
    "status": [
        # Specific patterns
        (r"\b(status|stats|statistics|check|how|what|condition)\s+(?:is|are|my|the)\s+(?:pet|health|happiness|energy|hunger|cleanliness)\b", "status"),
        (r"\b(how\s+is|what's|check|show|display|view)\s+(?:my\s+)?(?:pet|health|happiness|energy|hunger|cleanliness|stats|status)\b", "status"),
        (r"\b(show|display|view|see|check)\s+(?:pet\s+)?(?:status|stats|statistics|condition|state|info)\b", "status"),
        (r"\b(pet\s+)?(status|stats|statistics|condition|state|info|health)\b", "status"),
        # Variations
        (r"\b(how\s+are\s+you|how\s+doing|what's\s+up)\b", "status"),
    ],
    "analytics": [
        # Specific patterns
        (r"\b(analytics|analyses|analysis|report|reports|insights|dashboard|data)\b", "analytics"),
        (r"\b(show|open|view|display|see|check)\s+(?:analytics|report|dashboard|insights|data)\b", "analytics"),
        (r"\b(how\s+am\s+i\s+doing|my\s+progress|my\s+performance|care\s+summary|progress\s+report)\b", "analytics"),
        # Variations
        (r"\b(show\s+analytics|view\s+report|see\s+progress)\b", "analytics"),
    ],
    "quests": [
        # Specific patterns
        (r"\b(quest|quests|challenge|challenges|mission|missions|task|tasks|objective)\b", "quests"),
        (r"\b(show|open|view|display|see|check)\s+(?:my\s+)?(?:quest|quests|challenge|challenges|mission|missions|task|tasks)\b", "quests"),
        (r"\b(what\s+quest|active\s+quest|daily\s+quest|weekly\s+quest|current\s+mission)\b", "quests"),
        # Variations
        (r"\b(show\s+quests|view\s+challenges|see\s+missions)\b", "quests"),
    ],
    "shop": [
        # Specific patterns
        (r"\b(shop|store|buy|purchase|shopping|marketplace|market)\b", "shop"),
        (r"\b(show|open|view|display|see|browse)\s+(?:shop|store|marketplace|market)\b", "shop"),
        (r"\b(i\s+want\s+to\s+)?(buy|purchase|get|shop\s+for)\s+(?:something|item|toy|food|accessory)\b", "shop"),
        # Variations
        (r"\b(go\s+to\s+shop|open\s+store|view\s+shop)\b", "shop"),
    ],
    "budget": [
        # Specific patterns
        (r"\b(budget|finance|financial|money|coins|balance|spending|wallet)\b", "budget"),
        (r"\b(show|open|view|display|see|check)\s+(?:budget|finance|financial|balance|spending|wallet)\b", "budget"),
        (r"\b(how\s+much|how\s+many\s+coins|what's\s+my\s+balance|check\s+balance)\b", "budget"),
        # Variations
        (r"\b(show\s+budget|view\s+finance|check\s+wallet)\b", "budget"),
    ],
}

# Multi-step connectors
MULTI_STEP_CONNECTORS = [
    r"\bthen\b",
    r"\band\s+then\b",
    r"\bafter\s+that\b",
    r"\bnext\b",
    r"\bfollowed\s+by\b",
    r"\band\b",
    r"\b,\s*",
    r"\s+;\s*",
]

# Food type extraction patterns with synonyms
FOOD_PATTERNS = {
    "premium": [r"\b(premium|deluxe|gourmet|special|fancy|luxury|best|top)\b"],
    "treat": [r"\b(treat|snack|cookie|biscuit|reward|goodie|bonus)\b"],
    "tuna": [r"\b(tuna|fish|seafood|salmon)\b"],
    "standard": [r"\b(food|meal|dinner|breakfast|lunch|regular|normal)\b"],
}

# Game type extraction patterns with synonyms
GAME_PATTERNS = {
    "fetch": [r"\b(fetch|ball|retrieve|throw|catch)\b"],
    "puzzle": [r"\b(puzzle|brain|intelligence|smart|think|solve)\b"],
    "tug": [r"\b(tug|rope|pull|tug-of-war)\b"],
    "free_play": [r"\b(play|game|fun|activity|interact)\b"],
}

# Trick type extraction patterns with synonyms
TRICK_PATTERNS = {
    "sit": [r"\b(sit|sitting|sit\s+down)\b"],
    "stay": [r"\b(stay|wait|remain|hold)\b"],
    "roll": [r"\b(roll|rolling|roll\s+over)\b"],
    "shake": [r"\b(shake|paw|handshake|give\s+paw)\b"],
    "speak": [r"\b(speak|bark|meow|talk|say|vocalize)\b"],
    "fetch": [r"\b(fetch|retrieve|get|bring|go\s+get)\b"],
}

# Confidence thresholds
MIN_CONFIDENCE_THRESHOLD = 0.3  # Minimum confidence to execute
MEDIUM_CONFIDENCE_THRESHOLD = 0.5  # Medium confidence warning
HIGH_CONFIDENCE_THRESHOLD = 0.7  # High confidence threshold
