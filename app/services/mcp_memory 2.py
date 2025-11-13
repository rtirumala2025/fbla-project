"""
Lightweight in-memory context persistence for AI conversations.

This module implements a simple "Memory Context Provider" (MCP) that retains a
rolling history of chat turns for each session. The store is asyncio-friendly
and keeps a bounded number of messages per session to prevent unbounded growth.

The store is intentionally ephemeral: it keeps data in-process to satisfy the
demo requirements. It can be replaced with a distributed cache (Redis, Supabase
Edge, etc.) without changing the public API.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class MemoryMessage:
    """Represents a single conversational turn tracked by the MCP."""

    role: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def as_openai_dict(self) -> Dict[str, Any]:
        """
        Convert the memory entry into the OpenAI/OpenRouter chat message format.
        """

        message: Dict[str, Any] = {"role": self.role, "content": self.content}
        if self.metadata:
            message["metadata"] = self.metadata
        return message


class MCPMemoryStore:
    """Async-safe conversation memory with per-session locking."""

    def __init__(self, max_messages: int = 18) -> None:
        self._max_messages = max_messages
        self._sessions: Dict[str, List[MemoryMessage]] = {}
        self._locks: Dict[str, asyncio.Lock] = {}

    def _lock_for(self, session_id: str) -> asyncio.Lock:
        if session_id not in self._locks:
            self._locks[session_id] = asyncio.Lock()
        return self._locks[session_id]

    async def get_history(self, session_id: str) -> List[MemoryMessage]:
        """
        Retrieve the conversation history for a session.
        """

        lock = self._lock_for(session_id)
        async with lock:
            history = self._sessions.get(session_id, [])
            # Return shallow copies to avoid accidental mutation from callers.
            return [MemoryMessage(msg.role, msg.content, dict(msg.metadata)) for msg in history]

    async def append(self, session_id: str, message: MemoryMessage) -> None:
        """
        Append a new message to the session history, trimming to the configured limit.
        """

        lock = self._lock_for(session_id)
        async with lock:
            history = self._sessions.setdefault(session_id, [])
            history.append(message)
            if len(history) > self._max_messages:
                self._sessions[session_id] = history[-self._max_messages :]

    async def extend(self, session_id: str, messages: List[MemoryMessage]) -> None:
        """
        Add multiple messages to the history in a single lock acquisition.
        """

        lock = self._lock_for(session_id)
        async with lock:
            history = self._sessions.setdefault(session_id, [])
            history.extend(messages)
            if len(history) > self._max_messages:
                self._sessions[session_id] = history[-self._max_messages :]

    async def reset(self, session_id: str) -> None:
        """
        Drop the stored history for a session.
        """

        lock = self._lock_for(session_id)
        async with lock:
            self._sessions.pop(session_id, None)


