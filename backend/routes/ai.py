from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from typing import Optional
import json

from ..services import ai_service
from ..mcp.context_manager import context_manager, SessionContext
from ..database import get_db
from ..schemas.ai_schemas import AIRequest, AIResponse

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/chat", response_class=StreamingResponse)
async def chat_with_ai(
    request: Request,
    ai_request: AIRequest,
    db=Depends(get_db)
):
    """
    Chat with the AI assistant with streaming response
    """
    # Get or create session
    session_id = request.cookies.get("session_id")
    user_id = request.state.user.id if hasattr(request.state, "user") else None
    
    try:
        session = await context_manager.get_or_create_session(session_id, user_id)
        
        # Get chat history in OpenAI format
        chat_history = session.to_openai_format()
        
        # Prepare response stream
        async def generate():
            full_response = ""
            
            # Stream AI response
            async for chunk in ai_service.get_ai_response(
                message=ai_request.message,
                context={"messages": chat_history}
            ):
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            
            # Update session with the complete exchange
            await context_manager.update_session(
                session_id=session.session_id,
                user_message=ai_request.message,
                ai_response=full_response
            )
            
            # Signal end of stream
            yield "data: [DONE]\n\n"
        
        # Set cookie if new session
        response = StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )
        
        if not session_id:
            response.set_cookie(
                key="session_id",
                value=session.session_id,
                httponly=True,
                max_age=86400,  # 24 hours
                samesite="lax"
            )
            
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/context/{session_id}")
async def get_context(session_id: str):
    """Get the current context for a session"""
    try:
        session = await context_manager.get_or_create_session(session_id)
        return {
            "session_id": session.session_id,
            "messages": [
                {"role": msg.role, "content": msg.content} 
                for msg in session.messages
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
