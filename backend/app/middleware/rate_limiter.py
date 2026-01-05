import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # In-memory storage: {ip_address: [timestamp, timestamp, ...]}
        # Note: In production, use Redis. For FBLA demo, this is sufficient.
        self.request_history = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Only rate limit API endpoints
        if request.url.path.startswith("/api/"):
            client_ip = request.client.host or "unknown"
            current_time = time.time()
            
            # Clean up old requests
            self.request_history[client_ip] = [
                t for t in self.request_history[client_ip] 
                if current_time - t < self.window_seconds
            ]
            
            # Check limit
            if len(self.request_history[client_ip]) >= self.max_requests:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Rate limit exceeded. Please try again later."}
                )
            
            # Record request
            self.request_history[client_ip].append(current_time)

        response = await call_next(request)
        return response
