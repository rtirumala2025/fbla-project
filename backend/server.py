"""
Simple FastAPI backend for Companion Virtual Pet App
Handles AI responses and complex business logic
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import random
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Companion Pet API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock AI responses for Phase 2
AI_RESPONSES = [
    "I'm feeling great today! 🌟",
    "Can we play fetch soon? 🎾",
    "Thanks for taking care of me! 🍖",
    "I love spending time with you! ❤️",
    "That was so much fun! 😄",
    "I'm ready for an adventure! 🗺️",
    "You're the best pet parent ever! 🏆",
    "Can we go to the park? 🌳",
    "I need some belly rubs! 🤗",
    "Let's learn something new together! 📚",
]

# Request/Response models
class AIResponseRequest(BaseModel):
    pet_name: str
    pet_mood: str
    context: Optional[str] = None

class AIResponseModel(BaseModel):
    message: str
    mood: str

# Routes
@app.get("/")
async def root():
    return {"message": "Companion Pet API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/ai/pet-response", response_model=AIResponseModel)
async def get_pet_response(request: AIResponseRequest):
    """
    Generate AI pet response based on context
    In Phase 3, this will use OpenAI API
    """
    # For now, return a random response
    message = random.choice(AI_RESPONSES)
    
    # Customize based on mood
    if request.pet_mood == "happy":
        mood = "cheerful"
    elif request.pet_mood == "hungry":
        mood = "expectant"
        message = "I'm getting a bit hungry... 🍖"
    elif request.pet_mood == "tired":
        mood = "sleepy"
        message = "I could use a nap... 😴"
    else:
        mood = "neutral"
    
    return AIResponseModel(message=message, mood=mood)

@app.get("/api/stats/summary")
async def get_stats_summary():
    """
    Get global statistics (for analytics page)
    """
    return {
        "total_pets": 1234,
        "active_users": 567,
        "items_purchased": 8901,
        "happiness_average": 85.5
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

