## AI Endpoint Guide

The Virtual Pet assistant now offers two fully AI-powered endpoints backed by Llama 4 with MCP context caching.

### `POST /api/ai/chat`

- **Purpose**: Free-form conversational assistant that understands the pet’s current state and history.
- **Request Body**:
  - `session_id` *(optional)* – Stable identifier used for memory recall.
  - `message` *(required)* – User question or statement.
  - `model` *(optional)* – Override the default OpenRouter model configured via `OPENROUTER_MODEL`.
- **Response**:
  - `session_id` – Echoed/resolved session identifier.
  - `message` – Assistant reply optimised for the UI.
  - `mood` – One of `ecstatic`, `happy`, `content`, `anxious`, or `distressed`.
  - `notifications` – Actionable tips or reminders.
  - `pet_state` – Snapshot (`mood`, `happiness`, `energy`, `hunger`, `cleanliness`, `health`, `last_updated`).
  - `health_forecast` – Trend, risk, and recommended follow-up actions.

The endpoint automatically stores the conversation in the MCP context manager and falls back to a rule-based response when the OpenRouter key is unavailable.

### `POST /api/pet/interact`

- **Purpose**: Command-oriented interactions (`/feed`, `/play`, `/bathe`, `/rest`, `/status`) surfaced in the AI chat UI.
- **Request Body**:
  - `session_id` *(optional)* – Shared with chat to maintain continuity.
  - `action` *(required)* – Command keyword (case-insensitive).
  - `message` *(optional)* – Additional context such as food type or rest duration.
- **Response**:
  - `session_id` – Echoed session identifier.
  - `message` – AI-flavoured reaction rendered to the user.
  - `mood` – Updated mood label.
  - `pet_state` – Updated stats mirroring the dashboard cards.
  - `notifications` – Combined AI guidance and health tips.
  - `health_forecast` – Predictive outlook matching the `/api/ai/chat` structure.

### Error Handling & Retries

- Both services automatically retry transient OpenRouter failures up to three times with exponential backoff.
- When the AI backend is unavailable, deterministic yet context-aware fallbacks keep the UI responsive.

### Testing

Automated coverage includes:

- Llama reaction parsing and health forecasts (`backend/tests/test_pet_ai_service.py`)
- AI chat fallback behaviour (`backend/tests/test_ai_service.py`)
- Pet interaction command flow and status reporting (`backend/tests/test_pets.py`)

Use `pytest` from the backend directory to execute the full suite.

