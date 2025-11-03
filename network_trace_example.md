# Network Trace Examples for Key Operations

**Note**: These are example traces showing expected behavior. To capture actual traces, use browser DevTools Network tab while performing actions.

---

## 1. Profile Username Update

**Operation**: User updates username on Profile page  
**Expected Trace**:

```
REQUEST:
Method: PATCH
URL: https://xhhtkjtcdeewesijxbts.supabase.co/rest/v1/profiles?user_id=eq.<user_id>
Headers:
  Authorization: Bearer <jwt_token>
  apikey: <anon_key>
  Content-Type: application/json
  Prefer: return=representation

Body:
{
  "username": "NewUsername123",
  "updated_at": "2025-11-03T17:00:00.000Z"
}

RESPONSE:
Status: 200 OK
Body:
[
  {
    "id": "...",
    "user_id": "<user_id>",
    "username": "NewUsername123",
    "coins": 100,
    "avatar_url": null,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-03T17:00:00.000Z"
  }
]
```

**Verification**:
- ✅ Request has valid JWT in Authorization header
- ✅ Response 200 OK
- ✅ Returned data shows updated username
- ✅ updated_at timestamp changed

---

## 2. Settings Toggle (Sound)

**Operation**: User toggles sound setting ON  
**Expected Trace**:

```
REQUEST:
Method: POST
URL: https://xhhtkjtcdeewesijxbts.supabase.co/rest/v1/user_preferences
Headers:
  Authorization: Bearer <jwt_token>
  apikey: <anon_key>
  Content-Type: application/json
  Prefer: resolution=merge-duplicates,return=representation

Body:
{
  "user_id": "<user_id>",
  "sound": true,
  "updated_at": "2025-11-03T17:00:00.000Z"
}

RESPONSE:
Status: 201 Created (or 200 OK if upsert on existing)
Body:
[
  {
    "id": "...",
    "user_id": "<user_id>",
    "sound": true,
    "music": true,
    "notifications": true,
    "reduced_motion": false,
    "high_contrast": false,
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-03T17:00:00.000Z"
  }
]
```

**Verification**:
- ✅ Upsert operation (POST with merge-duplicates)
- ✅ Valid JWT token
- ✅ Response 200/201
- ✅ sound field updated to true

---

## 3. Pet Creation

**Operation**: User completes pet naming and clicks "Start Journey"  
**Expected Trace**:

```
REQUEST:
Method: POST
URL: https://xhhtkjtcdeewesijxbts.supabase.co/rest/v1/pets
Headers:
  Authorization: Bearer <jwt_token>
  apikey: <anon_key>
  Content-Type: application/json
  Prefer: return=representation

Body:
{
  "user_id": "<user_id>",
  "name": "Buddy",
  "species": "dog",
  "breed": "Mixed",
  "age": 0,
  "level": 1,
  "health": 100,
  "hunger": 75,
  "happiness": 80,
  "cleanliness": 90,
  "energy": 85,
  "xp": 0,
  "created_at": "2025-11-03T17:00:00.000Z",
  "updated_at": "2025-11-03T17:00:00.000Z"
}

RESPONSE:
Status: 201 Created
Body:
[
  {
    "id": "<pet_uuid>",
    "user_id": "<user_id>",
    "name": "Buddy",
    "species": "dog",
    "breed": "Mixed",
    "age": 0,
    "level": 1,
    "health": 100,
    "hunger": 75,
    "happiness": 80,
    "cleanliness": 90,
    "energy": 85,
    "xp": 0,
    "last_fed_at": null,
    "last_played_at": null,
    "created_at": "2025-11-03T17:00:00.000Z",
    "updated_at": "2025-11-03T17:00:00.000Z"
  }
]
```

**Verification**:
- ✅ POST with INSERT operation
- ✅ Valid JWT token
- ✅ Response 201 Created
- ✅ Pet returned with UUID
- ✅ UNIQUE constraint enforced (only one pet per user)

---

## 4. Feed Pet Action

**Operation**: User feeds pet from Feed screen  
**Expected Trace**:

```
REQUEST:
Method: PATCH
URL: https://xhhtkjtcdeewesijxbts.supabase.co/rest/v1/pets?user_id=eq.<user_id>
Headers:
  Authorization: Bearer <jwt_token>
  apikey: <anon_key>
  Content-Type: application/json
  Prefer: return=representation

Body:
{
  "hunger": 100,
  "energy": 90,
  "updated_at": "2025-11-03T17:00:00.000Z"
}

RESPONSE:
Status: 200 OK
Body:
[
  {
    "id": "<pet_uuid>",
    "user_id": "<user_id>",
    "name": "Buddy",
    "health": 100,
    "hunger": 100,
    "happiness": 80,
    "cleanliness": 90,
    "energy": 90,
    "updated_at": "2025-11-03T17:00:00.000Z",
    ...
  }
]
```

**Verification**:
- ✅ PATCH update operation
- ✅ Valid JWT token
- ✅ Response 200 OK
- ✅ hunger and energy stats updated
- ✅ updated_at changed

---

## 5. User Signup

**Operation**: New user registers with email/password  
**Expected Trace**:

```
REQUEST:
Method: POST
URL: https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/signup
Headers:
  apikey: <anon_key>
  Content-Type: application/json

Body:
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "data": {
    "display_name": "newuser"
  }
}

RESPONSE:
Status: 200 OK
Body:
{
  "access_token": "<jwt_token>",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "<refresh_token>",
  "user": {
    "id": "<new_user_uuid>",
    "email": "newuser@example.com",
    "user_metadata": {
      "display_name": "newuser"
    },
    "created_at": "2025-11-03T17:00:00.000Z"
  }
}
```

**Verification**:
- ✅ POST to /auth/v1/signup
- ✅ Response 200 OK
- ✅ JWT token returned
- ✅ User ID created in auth.users
- ✅ Email confirmation may be required (check settings)

---

## 6. Profile Creation (Setup Profile)

**Operation**: New user sets username for first time  
**Expected Trace**:

```
REQUEST:
Method: POST
URL: https://xhhtkjtcdeewesijxbts.supabase.co/rest/v1/profiles
Headers:
  Authorization: Bearer <jwt_token>
  apikey: <anon_key>
  Content-Type: application/json
  Prefer: return=representation

Body:
{
  "user_id": "<user_id>",
  "username": "cooluser123",
  "coins": 100,
  "created_at": "2025-11-03T17:00:00.000Z",
  "updated_at": "2025-11-03T17:00:00.000Z"
}

RESPONSE:
Status: 201 Created
Body:
[
  {
    "id": "<profile_uuid>",
    "user_id": "<user_id>",
    "username": "cooluser123",
    "coins": 100,
    "avatar_url": null,
    "created_at": "2025-11-03T17:00:00.000Z",
    "updated_at": "2025-11-03T17:00:00.000Z"
  }
]
```

**Verification**:
- ✅ POST with INSERT operation
- ✅ Valid JWT token
- ✅ Response 201 Created
- ✅ Profile row created with user_id
- ✅ RLS enforces auth.uid() = user_id

---

## 7. Unauthorized Request (RLS Test)

**Operation**: Attempt to update another user's profile  
**Expected Trace**:

```
REQUEST:
Method: PATCH
URL: https://xhhtkjtcdeewesijxbts.supabase.co/rest/v1/profiles?user_id=eq.<other_user_id>
Headers:
  Authorization: Bearer <jwt_token_for_different_user>
  apikey: <anon_key>
  Content-Type: application/json

Body:
{
  "username": "hacker123"
}

RESPONSE:
Status: 200 OK (but empty array - no rows updated due to RLS)
Body:
[]
```

**Verification**:
- ✅ Request sent with valid JWT
- ✅ Response 200 OK but empty array
- ✅ RLS policy blocked the update (auth.uid() != user_id)
- ✅ No data modified
- ✅ Security enforced at database level

---

## 8. Invalid Token Request

**Operation**: Attempt request with invalid/expired JWT  
**Expected Trace**:

```
REQUEST:
Method: GET
URL: https://xhhtkjtcdeewesijxbts.supabase.co/rest/v1/profiles?user_id=eq.<user_id>
Headers:
  Authorization: Bearer invalid_token_12345
  apikey: <anon_key>

RESPONSE:
Status: 401 Unauthorized
Body:
{
  "code": "PGRST301",
  "message": "JWT expired",
  "details": null,
  "hint": null
}
```

**Verification**:
- ✅ Request rejected at API level
- ✅ 401 Unauthorized response
- ✅ No data returned
- ✅ JWT validation working

---

## Manual Verification Steps

To capture actual network traces:

1. **Open Browser DevTools**
   - Press F12 or Cmd+Option+I
   - Go to Network tab
   - Check "Preserve log"

2. **Perform Action**
   - Log in / Sign up
   - Update username
   - Toggle settings
   - Create pet
   - Feed/play with pet

3. **Inspect Requests**
   - Look for requests to `supabase.co`
   - Click on request to see Headers, Payload, Response
   - Verify Authorization header exists
   - Check response status (200/201/204 for success, 401/403 for auth failures)

4. **Verify in Database**
   - Run corresponding SQL query to confirm data updated
   - Check `updated_at` timestamp changed
   - Verify RLS policies active

---

## Common Issues & Debugging

### Issue: No Authorization header
**Symptom**: Requests fail with 401
**Cause**: User not authenticated or session expired
**Fix**: Re-login, check localStorage for `supabase.auth.token`

### Issue: Empty response array on UPDATE/DELETE
**Symptom**: 200 OK but no rows affected
**Cause**: RLS policy blocking (user trying to modify other user's data)
**Fix**: Verify JWT user_id matches row's user_id

### Issue: CORS errors
**Symptom**: Network errors, no response
**Cause**: Supabase URL/keys incorrect or CORS not configured
**Fix**: Check .env file, verify Supabase project settings

### Issue: 409 Conflict on INSERT
**Symptom**: Cannot insert row
**Cause**: UNIQUE constraint violation (e.g., user already has pet)
**Fix**: Check constraints, may need UPDATE instead of INSERT

