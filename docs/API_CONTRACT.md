# API Contract v1

## Error envelope
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
```

## Auth (Google OAuth only)
- GET `/api/auth/google` - redirects to Google's consent screen.
- GET `/api/auth/google/callback` - Google redirects here with the auth result; backend verifies it, finds-or-creates the User by Google `sub`, sets a Secure/HttpOnly/SameSite session cookie, then redirects to `FRONTEND_ORIGIN`.
- GET `/api/auth/me` - returns the current session's user (401 if not authenticated).
- POST `/api/auth/logout` - clears the session cookie.

No password/email login or refresh-token endpoints exist. See `CLAUDE.md` for the security rationale.

## POST /api/study/reviews
Request:
```json
{ "sessionId": "uuid", "learningItemId": 1, "rating": 3 }
```
Response:
```json
{ "learningItemId": 1, "rating": 3, "reps": 4, "lapses": 1, "ease": 2.45, "intervalDays": 8, "dueDate": "2026-08-21" }
```

## GET /api/study/daily?limit=30
Returns due cards ordered by due date, then fills remaining capacity with unseen cards ordered by category/rank. No duplicate learningItemId values.

## GET /api/progress/summary
Returns total/learned/due/today counts and per-category counts.
