import os
import json
import logging
import time
from typing import Dict, Optional, AsyncGenerator, Any
import httpx
from fastapi import HTTPException, status
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class AIServiceError(Exception):
    """Base exception for AI service errors"""
    pass

class RateLimitError(AIServiceError):
    """Raised when rate limit is exceeded"""
    pass

class AIServiceUnavailableError(AIServiceError):
    """Raised when the AI service is unavailable"""
    pass

class AIService:
    def __init__(self):
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
            "Content-Type": "application/json"
        }

    async def _make_api_request(
        self, 
        messages: list[Dict[str, str]],
        model: str,
        max_retries: int = 3,
        initial_delay: float = 1.0
    ) -> AsyncGenerator[str, None]:
        """Internal method to make API request with retry logic"""
        attempt = 0
        last_error = None
        
        while attempt < max_retries:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream(
                        "POST",
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json={
                            "model": model,
                            "messages": messages,
                            "stream": True
                        },
                    ) as response:
                        if response.status_code == 429:
                            retry_after = float(response.headers.get('retry-after', 5.0))
                            logger.warning(f"Rate limited. Retrying after {retry_after} seconds...")
                            await asyncio.sleep(retry_after)
                            raise RateLimitError("Rate limit exceeded")
                            
                        if response.status_code >= 500:
                            raise AIServiceUnavailableError(f"AI service unavailable: {response.status_code}")
                            
                        if response.status_code != 200:
                            error = await response.aread()
                            logger.error(f"AI API error: {error}")
                            response.raise_for_status()
                        
                        # If we get here, the request was successful
                        async for chunk in response.aiter_lines():
                            if chunk.startswith("data: ") and chunk != "data: [DONE]":
                                try:
                                    data = json.loads(chunk[6:])
                                    if "choices" in data and data["choices"]:
                                        delta = data["choices"][0].get("delta", {})
                                        if "content" in delta:
                                            yield delta["content"]
                                except json.JSONDecodeError as e:
                                    logger.warning(f"Failed to parse chunk: {chunk}, error: {e}")
                                    continue
                        return  # Success!
            
            except (httpx.RequestError, AIServiceUnavailableError) as e:
                last_error = e
                attempt += 1
                if attempt < max_retries:
                    delay = initial_delay * (2 ** (attempt - 1))  # Exponential backoff
                    logger.warning(f"Attempt {attempt} failed. Retrying in {delay:.1f}s... Error: {e}")
                    await asyncio.sleep(delay)
                continue
                
        # If we've exhausted all retries
        logger.error(f"All {max_retries} attempts failed. Last error: {last_error}")
        raise AIServiceError(f"Failed after {max_retries} attempts: {last_error}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((RateLimitError, AIServiceUnavailableError)),
        reraise=True
    )
    async def get_ai_response(
        self, 
        message: str, 
        context: Optional[Dict] = None,
        model: str = "meta-llama/llama-3-70b-instruct"
    ) -> AsyncGenerator[str, None]:
        """
        Get AI response from OpenRouter with streaming support and automatic retries
        
        Args:
            message: User's message
            context: Optional conversation context
            model: Model to use for generation
            
        Yields:
            Chunks of the AI response
            
        Raises:
            HTTPException: For client or server errors
            AIServiceError: For other AI service errors
        """
        if not self.openrouter_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenRouter API key not configured"
            )

        try:
            # Prepare messages
            messages = []
            if context:
                messages.extend(context.get("messages", []))
            
            messages.append({"role": "user", "content": message})
            
            # Make the API request with retry logic
            async for chunk in self._make_api_request(messages, model):
                yield chunk
                
        except RateLimitError as e:
            logger.error(f"Rate limited: {e}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        except AIServiceUnavailableError as e:
            logger.error(f"Service unavailable: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable. Please try again later."
            )
        except AIServiceError as e:
            logger.error(f"AI service error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error communicating with AI service: {str(e)}"
            )
        except Exception as e:
            logger.exception("Unexpected error in get_ai_response")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )

# Global instance of the AI service
ai_service = AIService()

# Health check function
async def check_ai_service_health() -> Dict[str, Any]:
    """Check if the AI service is healthy"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ai_service.base_url}/health",
                headers={"Authorization": f"Bearer {ai_service.openrouter_api_key}"},
                timeout=5.0
            )
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "details": response.json() if response.status_code == 200 else None
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
