"""HTTP middleware providing structured error responses."""
from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.errors import AppException

logger = logging.getLogger(__name__)


async def error_handling_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
    try:
        return await call_next(request)
    except AppException as exc:
        logger.info("Handled AppException at %s: %s", request.url.path, exc)
        return JSONResponse(status_code=exc.status_code, content=exc.to_response())
    except HTTPException as exc:
        logger.warning("HTTPException at %s: %s", request.url.path, exc.detail)
        content: Dict[str, Any] = {
            "error": {
                "code": "http_error",
                "message": exc.detail,
            }
        }
        return JSONResponse(status_code=exc.status_code, content=content)
    except ValidationError as exc:
        logger.warning("Validation error at %s", request.url.path)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Request validation failed.",
                    "context": exc.errors(),
                }
            },
        )
    except Exception as exc:  # pragma: no cover - safety net
        logger.exception("Unhandled error at %s", request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "internal_server_error",
                    "message": "Something went wrong.",
                }
            },
        )
