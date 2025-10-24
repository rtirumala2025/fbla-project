from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AIRequest(BaseModel):
    """Request model for AI chat endpoint"""
    message: str = Field(..., min_length=1, max_length=1000)
    context: Optional[Dict[str, Any]] = None
    model: Optional[str] = "meta-llama/llama-3-70b-instruct"
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(500, ge=1, le=4000)

class AIResponse(BaseModel):
    """Response model for AI chat endpoint"""
    content: str
    session_id: str
    model: str
    usage: Dict[str, int] = {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0
    }

class AIContext(BaseModel):
    """Model for AI conversation context"""
    messages: List[Dict[str, str]] = []
    metadata: Dict[str, Any] = {}

class AIConfig(BaseModel):
    """Configuration for AI service"""
    model: str = "meta-llama/llama-3-70b-instruct"
    temperature: float = 0.7
    max_tokens: int = 500
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
