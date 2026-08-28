# CLAUDE.md - Speaking Core 1350

## Mission
Build a production-ready, mobile-first English speaking study PWA that syncs learning progress across iPhone and desktop. The canonical learning dataset is `data/speaking_core_1350_seed_v2.json`.

## Required stack
- Frontend: Vue 3 + TypeScript + Vite + PWA
- Backend: NestJS + TypeScript
- ORM/DB: Prisma + PostgreSQL 16
- Auth: Google OAuth 2.0 / OpenID Connect only (no passwords, no other providers). Backend verifies Google's signed result and identifies users by Google `sub`. Application session is a Secure, HttpOnly, SameSite cookie holding a backend-signed session token — no long-lived secrets in `localStorage`.
- Deployment: k3s on Hetzner Linux. Container images built from `apps/api/Dockerfile` / `apps/web/Dockerfile` and pushed to GitHub Container Registry (`ghcr.io/cleanbrain-developer`); manifests live in `k3s/` (see `k3s/README.md`). `docker-compose.dev.yml` (Postgres only) remains for local development.
- Reverse proxy: k3s's built-in Traefik ingress controller + cert-manager for automatic HTTPS (Let's Encrypt). No Caddy.

## Source of truth
1. `docs/IMPLEMENTATION_SPEC.md` - product/technical requirements
2. `data/speaking_core_1350_seed_v2.json` - canonical seed data
3. `data/speaking_core_1350_seed_v2_manifest.json` - counts/hash validation
4. `database/schema.prisma` - initial database contract

Do not regenerate or rewrite the learning content unless explicitly asked. Preserve seed IDs.

## Implementation order
1. Create a pnpm monorepo with `apps/web` and `apps/api`.
2. Implement Prisma schema/migrations and deterministic seed import.
3. Implement Google OAuth login and cookie-based session handling.
4. Implement study scheduling and progress endpoints.
5. Add tests for scheduler, auth, daily queue and seed validation.
6. Build Vue mobile-first study UI and PWA.
7. Add Dockerfiles, Compose, health checks and production README.
8. Verify seed count = 1350 and category counts = 300/150/700/200.

## Product rules
- Backend DB is the source of truth for progress and review scheduling.
- The client sends a rating (1-4); backend calculates next due date.
- Daily 30 queue: overdue/due reviews first, then unseen items. No duplicates.
- Dates are evaluated in the user's timezone. Default timezone can be `Asia/Seoul` until profile settings exist.
- Preserve four study categories: Conversation Chunk, Phrasal Verb, Core Word, Work English.
- PWA must be comfortable on iPhone Safari with one-hand controls.
- TTS can use the browser SpeechSynthesis API for v1.
- Speaking mode v1 can be typed recall + reveal; microphone recognition is optional and must not block launch.

## Scheduler v1
- Rating 1 / Again: lapses += 1; reps += 1; interval = 1 day; ease = max(1.3, ease - 0.2)
- Rating 2 / Hard: reps += 1; interval = max(1, round(previousInterval * 1.4)); ease = max(1.3, ease - 0.05)
- Rating 3 / Good: reps += 1; new card interval = 2; otherwise round(interval * ease)
- Rating 4 / Easy: reps += 1; ease = min(3.2, ease + 0.08); new card interval = 4; otherwise round(interval * (ease + 0.15))

## Engineering constraints
- Use DTO validation globally.
- Return a consistent API error envelope.
- Never trust Frontend-supplied identity claims; always verify Google's signed token/OAuth result server-side.
- Never store a Google Client Secret or session secret in Frontend code or `localStorage`.
- Use database uniqueness constraints for user/item progress and for `User.googleId`.
- Keep v1 as one API service and one PostgreSQL DB; no microservices, Redis, Kafka, or queues unless a proven need appears.
- Add `/health` endpoint and Docker healthcheck.
- Document every assumption instead of blocking implementation with non-critical questions.
- Do not commit secrets.

## Definition of done
- A new user can sign in with Google on iPhone and desktop and see the same progress.
- Seed import is deterministic and validated.
- Daily, due, new and weak study modes work.
- Review ratings persist and generate the next due date on the server.
- The app installs as a PWA.
- `docker compose up -d` can start production services after env setup.
- Core API tests and scheduler tests pass.
- README contains local setup, test, migration, seed, backup, Google OAuth setup and Hetzner deployment commands.
