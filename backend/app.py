"""
Main FastAPI application entry point.
Sets up the FastAPI app, includes routers, and configures middleware.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, pet, shop, minigames, profile, species, daily_score, ai

app = FastAPI(
    title="Virtual Pet API",
    description="Backend API for the Virtual Pet FBLA project",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(pet.router, prefix="/api/pet", tags=["Pet"])
app.include_router(shop.router, prefix="/api/shop", tags=["Shop"])
app.include_router(minigames.router, prefix="/api/minigames", tags=["Minigames"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(species.router, prefix="/api/species", tags=["Species"])
app.include_router(daily_score.router, prefix="/api/daily-score", tags=["Daily Score"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])

@app.get("/")
async def root():
    """Root endpoint that returns a welcome message."""
    return {"message": "Welcome to the Virtual Pet API!"}
