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

## Learning Items (read-only)
- GET `/api/learning-items?category=&search=&limit=&offset=` — `limit` max 200, default 50. Returns `{ items, total }`.
- GET `/api/learning-items/:id`

## Study
All endpoints require an authenticated session. Queue endpoints return `{ items, total }`, where each item is a `LearningItem` plus an optional `progress` object (`null` for never-studied items):
```json
{ "id": 1, "category": "Core Word", "rank": 1, "english": "go", "korean": "가다", "example": "go home",
  "progress": { "reps": 2, "ease": 2.5, "intervalDays": 6, "lapses": 0, "dueDate": "2026-08-19", "lastReviewedAt": "2026-08-13T03:00:00.000Z" } }
```

- GET `/api/study/daily?limit=30` — due cards first (ordered by due date), then unseen cards fill remaining capacity (ordered by category/rank). No duplicate `learningItemId` values.
- GET `/api/study/due?limit=30` — cards due today or overdue, ordered by due date.
- GET `/api/study/new?limit=30` — cards never studied by this user, ordered by category/rank.
- GET `/api/study/weak?limit=30` — cards with `lapses >= 1` or `ease <= 2.1` (v1 heuristic), ordered by ease ascending.
- POST `/api/study/sessions` — body `{ "mode": "daily" | "due" | "new" | "weak" | "category" }` → returns the created `StudySession`.
- PATCH `/api/study/sessions/:id/finish` — marks `endedAt`; 404 if the session doesn't belong to the caller.
- POST `/api/study/reviews`
  Request:
  ```json
  { "sessionId": "uuid", "learningItemId": 1, "rating": 3 }
  ```
  Response:
  ```json
  { "learningItemId": 1, "rating": 3, "reps": 4, "lapses": 1, "ease": 2.45, "intervalDays": 8, "dueDate": "2026-08-21" }
  ```
  Atomically upserts `LearningProgress`, inserts a `StudyReview`, and increments the session's `reviewedCount`. `rating` is 1 (다시/Again) – 4 (쉬움/Easy); the next interval/ease is computed server-side by the SRS v1 scheduler (`CLAUDE.md`), never trusted from the client.

## Progress
- GET `/api/progress/summary` — `{ total, learned, due, today, categories: [{ category, total, learned }] }`.
- GET `/api/progress/calendar?days=30` — `{ from, to, days: [{ date: "YYYY-MM-DD", count }] }`, one entry per day in range (zero-filled).

Due-date and "today" boundaries are computed in the user's stored timezone (`User.timezone`, default `Asia/Seoul`), not the server's local time.

## Chunk Drill

Separate from Study/SRS above — a shadowing/production-speed drill over `data/chunk_drill_v1.json` (independent `ChunkItem` catalog, no due dates, no scheduler). All endpoints require an authenticated session.

- GET `/api/chunk-drill/set?size=20` — `size` max 100, default 20. Returns `{ items, total }`; `total` is the full catalog size, not the returned slice. Each item:
  ```json
  { "id": 1, "rank": 1, "english": "I mean", "korean": "내 말은", "example": "I mean, it's not a big deal.",
    "practiceCount": 2, "lastPracticedAt": "2026-08-20T03:00:00.000Z" }
  ```
  Ordering: never-practiced items first (by `rank`), then practiced items by ascending `practiceCount`, then least-recently-practiced first.
- POST `/api/chunk-drill/complete` — body `{ "chunkItemIds": [1, 2, 3] }` (deduplicated server-side). Upserts `ChunkDrillProgress` per id: `practiceCount += 1`, `lastPracticedAt = now`. Returns `{ "practicedCount": 3 }`.
- GET `/api/chunk-drill/summary` — `{ total, practicedAtLeastOnce, practicedToday }`, `practicedToday` computed in the user's timezone like the Progress endpoints.
