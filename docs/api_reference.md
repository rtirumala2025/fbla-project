# API Reference

Complete API documentation for the Virtual Pet FBLA Backend API.

**Base URL**: `/api` (all endpoints are prefixed with `/api`)

**Authentication**: Most endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Table of Contents

- [Health](#health)
- [Authentication](#authentication)
- [Users](#users)
- [Profiles](#profiles)
- [Pets](#pets)
- [Pet Interactions](#pet-interactions)
- [AI Services](#ai-services)
- [Shop](#shop)
- [Events](#events)
- [Weather](#weather)
- [Accessories](#accessories)
- [Art Generation](#art-generation)

---

## Health

### GET /health

Health check endpoint for monitoring and testing.

**Authentication**: Not required

**Example Request**:
```bash
curl -X GET http://localhost:8000/health
```

**Response** (`200 OK`):
```json
{
  "status": "ok"
}
```

**Status Codes**:
- `200 OK`: Service is healthy

---

## Authentication

Base path: `/api/auth`

### POST /api/auth/signup

Create a new user account.

**Authentication**: Not required

**Example Request**:
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "johndoe"
  }'
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe"
}
```

**Response** (`201 Created`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Response** (`409 Conflict`):
```json
{
  "detail": "User with this email already exists"
}
```

**Status Codes**:
- `201 Created`: User created successfully
- `400 Bad Request`: Invalid input (e.g., invalid email format, password too short)
- `409 Conflict`: User already exists

---

### POST /api/auth/login

Authenticate and receive tokens.

**Authentication**: Not required

**Example Request**:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Response** (`401 Unauthorized`):
```json
{
  "detail": "Invalid email or password"
}
```

**Status Codes**:
- `200 OK`: Login successful
- `401 Unauthorized`: Invalid credentials

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**Authentication**: Not required

**Request Body**:
```json
{
  "refresh_token": "eyJ..."
}
```

**Response** (`200 OK`):
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Status Codes**:
- `200 OK`: Token refreshed
- `401 Unauthorized`: Invalid refresh token

---

### POST /api/auth/logout

Logout and invalidate tokens.

**Authentication**: Required (Bearer token in header)

**Request Body**:
```json
{
  "refresh_token": "eyJ..."
}
```

**Response** (`204 No Content`): No body

**Status Codes**:
- `204 No Content`: Logout successful
- `401 Unauthorized`: Invalid token

---

## Users

Base path: `/api/users`

### GET /api/users/

List all users.

**Authentication**: Required

**Response** (`200 OK`):
```json
[
  {
    "id": "user-id",
    "email": "user@example.com",
    "username": "username",
    "created_at": "2025-01-27T00:00:00Z"
  }
]
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: Not authenticated

---

### POST /api/users/

Create a new user.

**Authentication**: Required

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword"
}
```

**Response** (`201 Created`):
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "created_at": "2025-01-27T00:00:00Z"
}
```

**Status Codes**:
- `201 Created`: User created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated

---

## Profiles

Base path: `/api/profiles`

### GET /api/profiles/me

Get current user's profile.

**Authentication**: Required

**Response** (`200 OK`):
```json
{
  "id": "profile-id",
  "user_id": "user-id",
  "username": "username",
  "avatar_url": "https://...",
  "coin_balance": 1000,
  "created_at": "2025-01-27T00:00:00Z",
  "updated_at": "2025-01-27T00:00:00Z"
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Profile not found
- `401 Unauthorized`: Not authenticated

---

### POST /api/profiles/

Create a profile for the current user.

**Authentication**: Required

**Request Body**:
```json
{
  "username": "username",
  "avatar_url": "https://..." // optional
}
```

**Response** (`201 Created`):
```json
{
  "id": "profile-id",
  "user_id": "user-id",
  "username": "username",
  "avatar_url": "https://...",
  "coin_balance": 0,
  "created_at": "2025-01-27T00:00:00Z",
  "updated_at": "2025-01-27T00:00:00Z"
}
```

**Status Codes**:
- `201 Created`: Profile created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated

---

### PUT /api/profiles/me

Update current user's profile.

**Authentication**: Required

**Request Body**:
```json
{
  "username": "newusername", // optional
  "avatar_url": "https://..." // optional
}
```

**Response** (`200 OK`):
```json
{
  "id": "profile-id",
  "user_id": "user-id",
  "username": "newusername",
  "avatar_url": "https://...",
  "coin_balance": 1000,
  "created_at": "2025-01-27T00:00:00Z",
  "updated_at": "2025-01-27T00:00:00Z"
}
```

**Status Codes**:
- `200 OK`: Profile updated
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Profile not found

---

### DELETE /api/profiles/me

Delete current user's profile.

**Authentication**: Required

**Response** (`204 No Content`): No body

**Status Codes**:
- `204 No Content`: Profile deleted
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Profile not found

---

### POST /api/profiles/me/avatar

Upload an avatar image.

**Authentication**: Required

**Request**: Multipart form data with `file` field

**Response** (`200 OK`):
```json
{
  "avatar_url": "https://storage.supabase.co/..."
}
```

**Status Codes**:
- `200 OK`: Avatar uploaded
- `400 Bad Request`: Invalid file
- `401 Unauthorized`: Not authenticated

---

## Pets

Base path: `/api/pets`

### GET /api/pets

Get the current user's pet.

**Authentication**: Required

**Response** (`200 OK`):
```json
{
  "id": "pet-id",
  "user_id": "user-id",
  "name": "Fluffy",
  "species": "dragon",
  "breed": "Azure",
  "color": "blue",
  "created_at": "2025-01-27T00:00:00Z",
  "updated_at": "2025-01-27T00:00:00Z",
  "stats": {
    "hunger": 70,
    "hygiene": 80,
    "energy": 65,
    "mood": "content",
    "health": 90,
    "xp": 40,
    "level": 3,
    "evolution_stage": "juvenile",
    "is_sick": false
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Pet not found
- `401 Unauthorized`: Not authenticated

---

### POST /api/pets

Create a new pet for the current user.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Fluffy",
  "species": "dragon",
  "breed": "Azure",
  "color": "blue"
}
```

**Response** (`201 Created`):
```json
{
  "id": "pet-id",
  "user_id": "user-id",
  "name": "Fluffy",
  "species": "dragon",
  "breed": "Azure",
  "color": "blue",
  "created_at": "2025-01-27T00:00:00Z",
  "updated_at": "2025-01-27T00:00:00Z",
  "stats": {
    "hunger": 100,
    "hygiene": 100,
    "energy": 100,
    "mood": "happy",
    "health": 100,
    "xp": 0,
    "level": 1,
    "evolution_stage": "baby",
    "is_sick": false
  }
}
```

**Status Codes**:
- `201 Created`: Pet created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated

---

### PATCH /api/pets

Update the current user's pet.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "NewName", // optional
  "color": "red" // optional
}
```

**Response** (`200 OK`):
```json
{
  "id": "pet-id",
  "user_id": "user-id",
  "name": "NewName",
  "species": "dragon",
  "breed": "Azure",
  "color": "red",
  "created_at": "2025-01-27T00:00:00Z",
  "updated_at": "2025-01-27T00:00:00Z",
  "stats": { ... }
}
```

**Status Codes**:
- `200 OK`: Pet updated
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Pet not found

---

### POST /api/pets/actions/{action}

Perform an action on the pet.

**Authentication**: Required

**Path Parameters**:
- `action`: One of `feed`, `play`, `bathe`, `rest`

**Request Body**:
```json
{
  "food_type": "treat", // for feed action
  "game_type": "fetch", // for play action
  "duration_hours": 2 // for rest action
}
```

**Response** (`200 OK`):
```json
{
  "pet": { ... },
  "reaction": "wagged tail excitedly",
  "mood": "happy",
  "notifications": ["Pet is very happy!"],
  "health_forecast": {
    "trend": "improving",
    "risk": "low",
    "recommended_actions": []
  }
}
```

**Status Codes**:
- `200 OK`: Action performed
- `400 Bad Request`: Invalid action or input
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Pet not found

---

### GET /api/pets/diary

Get pet diary entries.

**Authentication**: Required

**Response** (`200 OK`):
```json
[
  {
    "id": "entry-id",
    "pet_id": "pet-id",
    "mood": "happy",
    "note": "Went for a walk",
    "created_at": "2025-01-27T00:00:00Z"
  }
]
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: Not authenticated

---

### POST /api/pets/diary

Create a diary entry.

**Authentication**: Required

**Request Body**:
```json
{
  "mood": "happy",
  "note": "Had a great day playing"
}
```

**Response** (`201 Created`):
```json
{
  "id": "entry-id",
  "pet_id": "pet-id",
  "mood": "happy",
  "note": "Had a great day playing",
  "created_at": "2025-01-27T00:00:00Z"
}
```

**Status Codes**:
- `201 Created`: Entry created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Pet not found

---

## Pet Interactions

Base path: `/api/pet`

### POST /api/pet/interact

Interact with the virtual pet via natural language command.

**Authentication**: Required

**Request Body**:
```json
{
  "action": "feed",
  "message": "Give a treat",
  "session_id": "session-123" // optional
}
```

**Supported Actions**:
- `feed`, `snack`, `treat` → Feed action
- `play`, `pet`, `train`, `game` → Play action
- `bathe`, `clean`, `groom` → Bathe action
- `rest`, `sleep` → Rest action
- `status` → Get pet status

**Response** (`200 OK`):
```json
{
  "session_id": "session-123",
  "message": "Fluffy wagged tail excitedly. Mood now: happy.",
  "mood": "happy",
  "pet_state": {
    "mood": "happy",
    "happiness": 85,
    "energy": 75,
    "hunger": 80,
    "cleanliness": 90,
    "health": 95,
    "last_updated": "2025-01-27T00:00:00Z"
  },
  "notifications": ["Pet is very happy!"],
  "health_forecast": {
    "trend": "improving",
    "risk": "low",
    "recommended_actions": []
  }
}
```

**Status Codes**:
- `200 OK`: Interaction successful
- `400 Bad Request`: Unsupported command
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Pet not found

---

## AI Services

Base path: `/api/ai`

### POST /api/ai/chat

Chat with the virtual pet AI companion (Scout). Provides context-aware responses based on pet state and conversation history. Supports multi-turn conversations with session management.

**Authentication**: Required

**Example Request**:
```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How is my pet doing today?",
    "session_id": "session-12345"
  }'
```

**Request Body**:
```json
{
  "message": "How is my pet doing today?",
  "session_id": "session-12345",
  "model": "meta-llama/llama-3.2-3b-instruct"
}
```

**Fields**:
- `message` (required): User's chat message
- `session_id` (optional): Session ID for conversation continuity. If not provided, a new session is created.
- `model` (optional): LLM model override. Defaults to configured OpenRouter model.

**Response** (`200 OK`):
```json
{
  "session_id": "session-12345",
  "message": "Fluffy is doing wonderfully! Their energy is high at 85%, hunger is good at 75%, and they seem very content. I noticed they enjoyed playing earlier. Consider giving them a treat or going for a walk together!",
  "mood": "happy",
  "notifications": [
    "Pet has been active today - great job keeping them engaged!",
    "Hunger level is optimal - no immediate feeding needed"
  ],
  "pet_state": {
    "mood": "happy",
    "happiness": 85,
    "energy": 85,
    "hunger": 75,
    "cleanliness": 80,
    "health": 90,
    "last_updated": "2025-01-27T14:30:00Z"
  },
  "health_forecast": {
    "trend": "improving",
    "risk": "low",
    "recommended_actions": [
      "Continue current care routine",
      "Maintain regular play sessions"
    ]
  }
}
```

**Error Response** (`401 Unauthorized`):
```json
{
  "detail": "Not authenticated"
}
```

**Error Response** (`503 Service Unavailable`):
```json
{
  "detail": "AI service temporarily unavailable"
}
```

**Status Codes**:
- `200 OK`: Chat response generated successfully
- `400 Bad Request`: Invalid input (missing message)
- `401 Unauthorized`: Not authenticated or invalid token
- `503 Service Unavailable`: AI service (OpenRouter) is unavailable

---

### POST /api/ai/budget_advice

Generate personalized budget advice and spending forecast based on transaction history. Uses AI to analyze spending patterns and provide actionable financial advice.

**Authentication**: Required

**Example Request**:
```bash
curl -X POST http://localhost:8000/api/ai/budget_advice \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "transaction_history": [
      {"amount": -50, "category": "food", "date": "2025-01-20T10:00:00Z"},
      {"amount": 100, "category": "income", "date": "2025-01-19T09:00:00Z"},
      {"amount": -25, "category": "toys", "date": "2025-01-18T15:30:00Z"}
    ]
  }'
```

**Request Body**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "transaction_history": [
    {
      "amount": -50,
      "category": "food",
      "date": "2025-01-20T10:00:00Z"
    },
    {
      "amount": 100,
      "category": "income",
      "date": "2025-01-19T09:00:00Z"
    },
    {
      "amount": -25,
      "category": "toys",
      "date": "2025-01-18T15:30:00Z"
    }
  ]
}
```

**Fields**:
- `user_id` (required): Must match authenticated user ID
- `transaction_history` (required): Array of transaction objects with `amount` (negative for expenses, positive for income), `category`, and `date`

**Response** (`200 OK`):
```json
{
  "advice": "Based on your spending patterns, you're spending about 75% of your income. I recommend setting aside 20% for savings each month. Your top spending category is food, so consider meal planning to reduce costs. Track your daily spending to identify additional savings opportunities.",
  "forecast": [
    {
      "month": "2025-02",
      "predicted_spend": 255.00
    },
    {
      "month": "2025-03",
      "predicted_spend": 260.10
    },
    {
      "month": "2025-04",
      "predicted_spend": 265.30
    },
    {
      "month": "2025-05",
      "predicted_spend": 270.61
    },
    {
      "month": "2025-06",
      "predicted_spend": 276.02
    },
    {
      "month": "2025-07",
      "predicted_spend": 281.54
    }
  ]
}
```

**Error Response** (`403 Forbidden`):
```json
{
  "detail": "Cannot access budget advice for another user"
}
```

**Status Codes**:
- `200 OK`: Advice generated successfully
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Attempting to access another user's budget advice
- `500 Internal Server Error`: Failed to generate advice (fallback advice still returned)

---

### POST /api/ai/pet_name_suggestions

Validate and suggest pet names.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Fluffy",
  "species": "dragon"
}
```

**Response** (`200 OK`):
```json
{
  "is_valid": true,
  "suggestions": ["Fluffy", "Fluff", "Fluffster"],
  "reasoning": "Name fits the pet's personality"
}
```

**Status Codes**:
- `200 OK`: Validation and suggestions provided
- `401 Unauthorized`: Not authenticated

---

### POST /api/ai/pet_behavior

Analyze and predict pet behavior.

**Authentication**: Required

**Request Body**:
```json
{
  "pet_id": "pet-id",
  "observation_period": "7d"
}
```

**Response** (`200 OK`):
```json
{
  "behavior_patterns": ["Active in mornings", "Prefers play over rest"],
  "predictions": ["Likely to be energetic tomorrow"],
  "recommendations": ["Schedule playtime in morning"]
}
```

**Status Codes**:
- `200 OK`: Analysis complete
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Pet not found

---

## Shop

Base path: `/api/shop`

### GET /api/shop/items

List available shop items.

**Authentication**: Not required (but recommended for personalized pricing)

**Response** (`200 OK`):
```json
[
  {
    "id": "item-id",
    "name": "Premium Food",
    "category": "food",
    "price": 50,
    "description": "High-quality nutrition",
    "effects": {
      "hunger": 20,
      "happiness": 10
    }
  }
]
```

**Status Codes**:
- `200 OK`: Success

---

### POST /api/shop/purchase

Purchase an item.

**Authentication**: Required

**Request Body**:
```json
{
  "item_id": "item-id",
  "quantity": 1
}
```

**Response** (`202 Accepted`):
```json
{
  "message": "Purchase successful",
  "new_balance": 950,
  "item": { ... }
}
```

**Status Codes**:
- `202 Accepted`: Purchase processed
- `400 Bad Request`: Insufficient funds or invalid item
- `401 Unauthorized`: Not authenticated

---

## Events

Base path: `/api/events`

### GET /api/events

List current and upcoming seasonal events.

**Authentication**: Required

**Response** (`200 OK`):
```json
{
  "current": [
    {
      "event_id": "spring-festival",
      "name": "Spring Festival",
      "description": "Celebrate spring with your pet",
      "start_date": "2025-03-20",
      "end_date": "2025-03-27",
      "type": "seasonal",
      "effects": {
        "mood": 10,
        "stat_modifiers": {}
      },
      "is_active": true,
      "is_upcoming": false,
      "days_remaining": 5,
      "participation_status": "participating"
    }
  ],
  "upcoming": []
}
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: Not authenticated

---

### GET /api/events/{event_id}

Get details for a specific event.

**Authentication**: Required

**Path Parameters**:
- `event_id`: Event identifier

**Response** (`200 OK`):
```json
{
  "event_id": "spring-festival",
  "name": "Spring Festival",
  "description": "Celebrate spring with your pet",
  "start_date": "2025-03-20",
  "end_date": "2025-03-27",
  "type": "seasonal",
  "effects": { ... },
  "is_active": true,
  "is_upcoming": false,
  "days_remaining": 5,
  "participation_status": "participating"
}
```

**Status Codes**:
- `200 OK`: Success
- `404 Not Found`: Event not found
- `401 Unauthorized`: Not authenticated

---

## Weather

Base path: `/api/weather`

### GET /api/weather

Get current weather snapshot.

**Authentication**: Required

**Query Parameters**:
- `lat` (optional): Latitude
- `lon` (optional): Longitude

**Response** (`200 OK`):
```json
{
  "condition": "sunny",
  "description": "Clear sky",
  "icon": "01d",
  "temperature_c": 22,
  "humidity": 65,
  "wind_speed": 5.2,
  "is_fallback": false,
  "fetched_at": "2025-01-27T00:00:00Z",
  "provider": "openweathermap"
}
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: Not authenticated

---

## Accessories

Base path: `/api/accessories`

### GET /api/accessories

List available accessories.

**Authentication**: Not required

**Response** (`200 OK`):
```json
{
  "accessories": [
    {
      "accessory_id": "hat-1",
      "name": "Wizard Hat",
      "type": "hat",
      "rarity": "rare",
      "effects": {
        "mood": 5
      },
      "color_palette": ["#FF5733", "#33FF57"],
      "preview_url": "https://..."
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success

---

### POST /api/accessories/equip

Equip or unequip an accessory.

**Authentication**: Required

**Request Body**:
```json
{
  "accessory_id": "hat-1",
  "pet_id": "pet-id", // optional, uses current pet if not provided
  "equipped": true
}
```

**Response** (`200 OK`):
```json
{
  "accessory_id": "hat-1",
  "pet_id": "pet-id",
  "equipped": true,
  "equipped_color": "#FF5733",
  "equipped_slot": "hat",
  "applied_mood": "happy",
  "updated_at": "2025-01-27T00:00:00Z"
}
```

**Status Codes**:
- `200 OK`: Accessory equipped/unequipped
- `400 Bad Request`: Invalid accessory or pet
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Pet or accessory not found

---

## Art Generation

Base path: `/api/art`

### POST /api/art/generate

Generate a pet avatar using AI with accessory context.

**Authentication**: Required

**Request Body**:
```json
{
  "pet_id": "pet-id",
  "accessory_ids": ["hat-1", "collar-1"],
  "style": "cartoon",
  "force_refresh": false
}
```

**Response** (`200 OK`):
```json
{
  "image_base64": "data:image/png;base64,iVBORw0KG...",
  "cached": false,
  "prompt": "A charismatic portrait of Fluffy...",
  "style": "cartoon",
  "accessory_ids": ["hat-1", "collar-1"],
  "mood": "happy",
  "palette": {
    "primary": "#FF5733",
    "secondary": "#33FF57"
  },
  "created_at": "2025-01-27T00:00:00Z"
}
```

**Status Codes**:
- `200 OK`: Art generated
- `400 Bad Request`: Invalid input or accessories
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Pet not found

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid input: field 'email' is required"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "An internal error occurred"
}
```

---

## Rate Limiting

API rate limits may apply. Check response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Pagination

Endpoints that return lists may support pagination via query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "items": [...],
  "page": 1,
  "limit": 20,
  "total": 100,
  "pages": 5
}
```

---

## WebSocket / Realtime

Some endpoints support real-time updates via Supabase Realtime subscriptions. Check the frontend implementation for subscription patterns.

---

---

## Example Usage Workflows

### Complete Pet Care Session

1. **Login**:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

2. **Check Pet Status** (using NLP command):
```bash
curl -X POST http://localhost:8000/api/ai/nlp_command \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"command": "how is my pet doing?"}'
```

3. **Feed Pet**:
```bash
curl -X POST http://localhost:8000/api/pets/actions/feed \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"food_type": "treat"}'
```

4. **Chat with AI**:
```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I do with my pet today?"}'
```

### Budget Analysis Workflow

1. **Get Budget Advice**:
```bash
curl -X POST http://localhost:8000/api/ai/budget_advice \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<your-user-id>",
    "transaction_history": [...]
  }'
```

2. **Generate Finance Scenario**:
```bash
curl -X POST http://localhost:8000/api/ai/finance_simulator/scenario \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_type": "investment",
    "user_context": {"age": 20, "income": 2000}
  }'
```

---

*Last Updated: 2025-01-27*  
*Generated from FastAPI routers and docstrings*  
*Enhanced with examples by Documentation Completion Agent*
