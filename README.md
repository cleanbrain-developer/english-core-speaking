# Speaking Core 1350

영어 회화 학습(문장 청크, 구동사, 핵심 단어, 비즈니스 영어) 1,350개 항목을 서버 기반 진도 동기화와 함께 학습하는 모바일 우선 PWA입니다. PC와 스마트폰에서 동일한 Google 계정으로 로그인해 학습 상태를 공유합니다.

> **현재 상태: Phase 2 완료 + Chunk 스피킹 드릴 추가** — 모노레포/DB/Google OAuth 인증/Seed(Phase 1)에 이어 SRS v1 복습 스케줄러, 오늘의 30개/복습/신규/취약 큐, 학습 세션·리뷰 API, 진행률 요약/캘린더, 카드형 학습 UI, 카테고리·검색 브라우징(무한 스크롤)까지 구현되어 있습니다(Phase 2). 여기에 더해, SRS 복습과는 별개로 고빈도 스피킹 Chunk를 쉐도잉으로 반복 연습하는 "Chunk 스피킹 드릴" 메뉴가 추가되었습니다. 자세한 범위는 `CLAUDE.md`, `docs/IMPLEMENTATION_SPEC.md`, `docs/API_CONTRACT.md` 참고.

## Architecture

```mermaid
flowchart LR
  U[iPhone / Desktop PWA] -->|HTTPS| RP[Caddy / Nginx]
  RP --> W[Vue 3 Web]
  RP -->|/api| A[NestJS API]
  A --> P[(PostgreSQL 16)]
```

프로덕션에서는 프론트엔드와 백엔드가 같은 도메인을 사용합니다 (`/` → Vue, `/api/*` → NestJS). Google OAuth Callback도 같은 도메인 하위(`/api/auth/google/callback`)에서 처리되어 CORS/쿠키/Redirect URI 구성이 단순해집니다.

인증은 **Google OAuth 2.0 / OpenID Connect만** 지원합니다. 자체 회원가입, 이메일/비밀번호 로그인은 존재하지 않습니다. 로그인 성공 시 백엔드가 Secure/HttpOnly/SameSite 쿠키에 서명된 세션 토큰을 발급하며, 프론트엔드 JavaScript는 이 토큰에 접근하지 않습니다.

## Directory Structure

```text
english-core-speaking/
├─ apps/
│  ├─ web/            # Vue 3 + Vite + PWA
│  │  └─ src/{api,components,composables,router,stores,views}
│  └─ api/             # NestJS
│     └─ src/{auth,users,learning-items,study,progress,chunk-drill,health,prisma,common}
├─ prisma/
│  ├─ schema.prisma    # 실제 사용되는 스키마 (database/schema.prisma와 동기화)
│  └─ seed.ts           # deterministic upsert 기반 seed 스크립트 (canonical seed + chunk drill 데이터셋)
├─ database/schema.prisma   # 최초 계약서(리뷰용 기준 문서)
├─ data/                # Canonical seed (1,350개 항목, 임의 수정 금지) + chunk_drill_v1.json(별도 보조 데이터셋)
├─ deploy/               # 프로덕션 Docker Compose, Caddyfile
├─ docker-compose.dev.yml   # 로컬 개발용 PostgreSQL만 기동
├─ scripts/              # seed 검증, PWA 아이콘 생성 스크립트
└─ docs/                 # 제품/기술 명세, API 계약
```

## Requirements

- Node.js 20+
- pnpm 9+ (`corepack enable` 권장)
- Docker Desktop (PostgreSQL 및 프로덕션 이미지 실행용)
- Google Cloud 프로젝트 (OAuth 클라이언트) — 실제 로그인 테스트 시 필요

## Local 실행 방법

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env`를 열어 최소한 아래 값을 채웁니다.

- `POSTGRES_PASSWORD` — 임의의 로컬 비밀번호
- `SESSION_SECRET` — `openssl rand -base64 48` 로 생성
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — [Google OAuth 설정](#google-oauth-설정-방법) 참고. 실제 로그인 테스트를 하지 않는다면 임의의 placeholder 값으로도 서버는 기동됩니다(단, 실제 Google 로그인은 동작하지 않습니다).

로컬에서 PostgreSQL을 5432가 아닌 다른 포트로 띄운다면(`docker-compose.dev.yml` 기본값은 `5433`), `DATABASE_URL`의 포트도 맞춰줍니다.

### 3. Database 실행

```bash
docker compose -f docker-compose.dev.yml up -d
```

PostgreSQL 16 컨테이너가 `localhost:5433`에 뜹니다 (호스트에 이미 5432를 쓰는 다른 서비스가 있을 수 있어 기본 포트를 피했습니다. 비어있다면 5432로 바꿔도 무방합니다).

### 4. Migration 실행

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init
```

### 5. Seed 실행

```bash
pnpm seed
```

`data/speaking_core_1350_seed_v2.json`의 1,350개 항목과 `data/chunk_drill_v1.json`의 Chunk 스피킹 드릴 100개 항목을 각각 `id` 기준 upsert로 적재합니다. 여러 번 실행해도 중복되지 않습니다(idempotent).

검증:

```bash
pnpm seed:validate   # scripts/validate_seed.py — 로컬에 Python이 설치되어 있어야 합니다
```

### 6. Backend 실행

```bash
pnpm dev:api
```

`http://localhost:3000/api/health` 로 헬스체크를 확인합니다.

### 7. Frontend 실행

```bash
pnpm dev:web
```

`http://localhost:5173` 접속. Vite dev server가 `/api/*` 요청을 `http://localhost:3000`으로 프록시합니다.

## Google OAuth 설정 방법

### Google Cloud Console 설정

1. https://console.cloud.google.com/ 접속 → 프로젝트 선택(또는 새로 생성)
2. **APIs & Services > OAuth consent screen**
   - User Type: External (개인 프로젝트라면 Testing 모드로 충분)
   - 앱 이름, 지원 이메일 등 필수 항목 입력
3. **APIs & Services > Credentials > Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins**
     - 로컬: `http://localhost:5173`
     - 운영: `https://<your-domain>`
   - **Authorized redirect URIs**
     - 로컬: `http://localhost:3000/api/auth/google/callback`
     - 운영: `https://<your-domain>/api/auth/google/callback`
4. 생성된 **Client ID**, **Client Secret**을 `.env`의 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`에 입력
5. `GOOGLE_CALLBACK_URL`을 3번에서 등록한 Redirect URI와 **정확히 동일하게** 설정

### 로그인 흐름

1. 프론트엔드에서 "Google로 로그인" 클릭 → `GET /api/auth/google`로 이동
2. 백엔드(Passport `google-oauth20`)가 Google 동의 화면으로 리다이렉트
3. 사용자가 Google 계정으로 인증
4. Google이 `GET /api/auth/google/callback`으로 결과를 반환 → 백엔드가 서버 간 통신으로 검증(프론트엔드는 어떤 토큰도 다루지 않음)
5. Google `sub` 기준으로 사용자 조회, 없으면 생성
6. 서명된 세션 토큰을 Secure/HttpOnly/SameSite 쿠키로 발급 → `FRONTEND_ORIGIN`으로 리다이렉트
7. 이후 요청은 쿠키로 인증 (`GET /api/auth/me`로 현재 사용자 확인)
8. 로그아웃: `POST /api/auth/logout` (쿠키 제거)

## 환경변수 설정

`.env.example` 참고. Production Credential은 절대 Git에 커밋하지 않습니다.

| 변수 | 설명 |
| --- | --- |
| `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` | PostgreSQL 접속 정보 |
| `DATABASE_URL` | Prisma 접속 문자열 |
| `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 정보 |
| `GOOGLE_CALLBACK_URL` | Google Console에 등록한 Redirect URI와 일치해야 함 |
| `SESSION_SECRET` | 세션 쿠키 서명용 비밀키 |
| `FRONTEND_ORIGIN` | CORS 허용 origin이자 로그인 성공 후 리다이렉트 대상 |
| `VITE_API_BASE_URL` | 프론트엔드가 호출할 API base path |

## Test 실행

```bash
pnpm test:api    # 단위 테스트 (DB 불필요)
pnpm test:web    # Vitest 단위 테스트

# e2e (로컬 PostgreSQL이 떠 있고 migrate/seed가 끝난 상태에서)
cd apps/api && npx jest --config ./test/jest-e2e.json
```

`test:api`의 e2e 스위트는 `/api/health`, 인증 Guard가 비인증 요청을 401로 차단하는지, `/api/auth/google`이 Google 동의 화면으로 리다이렉트하는지 검증합니다(더미 Client ID로도 리다이렉트 자체는 발급되며, 실제 Google 서버 호출은 발생하지 않습니다). `study.e2e-spec.ts`는 세션 생성 → 리뷰 제출 → 복습 큐 반영 → 진행률/캘린더 갱신까지 실제 Google 로그인 없이 throwaway 테스트 사용자로 검증합니다.

## Production Build

```bash
pnpm build          # api + web 순서로 빌드
pnpm typecheck       # tsc / vue-tsc
```

## Docker 실행 방법

### 로컬 개발용 (PostgreSQL만)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 프로덕션 스택 (PostgreSQL + API + Web + Caddy)

```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d --build
```

> `docker compose`의 프로젝트 디렉터리는 기본적으로 첫 번째 `-f`로 지정한 파일이 위치한 디렉터리(`deploy/`)를 기준으로 하므로, 저장소 루트의 `.env`를 사용하려면 반드시 `--env-file .env`를 함께 지정합니다.

최초 기동 후 마이그레이션과 seed를 컨테이너 네트워크 안에서 실행합니다.

```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec api \
  node_modules/.bin/prisma migrate deploy --schema ../../prisma/schema.prisma
```

Caddy는 `deploy/Caddyfile.example`을 `deploy/Caddyfile`로 복사해 사용합니다. 기본값은 `http://cleanbrain.me:3000`처럼 실제 도메인 + 커스텀 포트의 평문 HTTP입니다(HTTPS는 아직 미적용) — 자세한 배포 순서는 아래 "Hetzner 배포" 섹션 참고. 로컬 검증 시에는 도메인이 없으므로 `caddy` 서비스 없이 `postgres`/`api`/`web`만 띄우는 것을 권장합니다.

## Hetzner 배포 (Production)

`http://cleanbrain.me:3000`으로 이 프로젝트를 단독으로 Hetzner에 올리는 순서입니다. **일단 서비스를 띄우는 게 목적이라 HTTPS는 아직 켜지 않습니다** — 평문 HTTP + 커스텀 포트 3000이며, 인증서/ACME가 전혀 개입하지 않아 가장 단순합니다. 나중에 HTTPS로 전환하는 방법은 6단계 마지막에 별도로 안내합니다. 다른 프로젝트는 같은 서버에서 다른 포트/서브도메인으로 독립적으로 구동할 수 있습니다. 모든 명령어는 서버에 SSH로 접속한 뒤(별도 표기가 없으면) 실행합니다.

### 1. 서버 준비
- Hetzner Cloud Console에서 서버 생성 (Ubuntu 22.04+, 최소 2vCPU/4GB 권장), SSH 키 등록
- 도메인 DNS에 A 레코드 등록: `cleanbrain.me` → 서버 공인 IP (이미 서브도메인을 쓰기로 했다면 `Host`에 해당 서브도메인 입력)
- 전파 확인: `dig +short cleanbrain.me`가 서버 IP와 일치하는지
- 방화벽: 22(SSH)와 3000(서비스)만 허용 — HTTPS를 아직 안 쓰므로 80/443은 불필요
  ```bash
  ufw allow 22/tcp && ufw allow 3000/tcp && ufw enable
  ```

### 2. Docker 설치
```bash
curl -fsSL https://get.docker.com | sh
```

### 3. 저장소 배포
```bash
git clone https://github.com/cleanbrain-developer/english-core-speaking.git
cd english-core-speaking
```
이미 배포된 서버를 업데이트할 때는 `git pull`만 실행하면 됩니다(아래 7단계부터 반복).

### 4. 환경변수 설정
```bash
cp .env.example .env
nano .env   # 또는 vi
```
로컬 개발과 다르게 채워야 하는 값:
- `POSTGRES_PASSWORD` — 강력한 랜덤 값
- `SESSION_SECRET` — `openssl rand -base64 48`
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` — 프로덕션용 Google OAuth Credential (5단계에서 발급/등록)
- `GOOGLE_CALLBACK_URL=http://cleanbrain.me:3000/api/auth/google/callback`
- `FRONTEND_ORIGIN=http://cleanbrain.me:3000`
- `NODE_ENV=production`

### 5. Google Cloud Console에 프로덕션 값 등록
기존 OAuth Client(또는 프로덕션용으로 새로 생성한 Client)의 **Credentials** 설정에 추가:
- Authorized JavaScript origins: `http://cleanbrain.me:3000`
- Authorized redirect URIs: `http://cleanbrain.me:3000/api/auth/google/callback`

### 6. Caddyfile 준비
```bash
cp deploy/Caddyfile.example deploy/Caddyfile
```
기본 `deploy/Caddyfile.example`의 첫 블록이 바로 이 패턴입니다:
```
http://cleanbrain.me:3000 {
  encode zstd gzip
  handle /api/* { reverse_proxy api:3000 }
  handle { reverse_proxy web:80 }
}
```
`http://` 스킴을 명시하면 Caddy가 그 사이트에 대해 자동 HTTPS/ACME를 아예 시도하지 않습니다 — 그래서 포트 80을 열 필요가 없습니다. `deploy/docker-compose.prod.yml`의 `caddy` 서비스는 호스트 **3000**만 매핑합니다. 도메인이 다르면 파일의 `cleanbrain.me`를 실제 도메인으로 바꾸세요. 파일 하단에 "HTTPS로 전환할 때"/"도메인 없을 때"/"표준 443 포트로 쓰고 싶을 때" 대안 예시도 주석으로 포함되어 있습니다.

### 7. 빌드 및 기동
```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d --build
docker compose --env-file .env -f deploy/docker-compose.prod.yml ps
```

### 8. Migration 실행
```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec api \
  node_modules/.bin/prisma migrate deploy --schema ../../prisma/schema.prisma
```

### 9. Seed 실행 (최초 1회)
API 이미지 빌드 시 `prisma/seed.ts`를 미리 컴파일해두므로, 컨테이너 안에서 `node`만으로 바로 실행됩니다(SSH 터널 불필요):
```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec api node ../../prisma-dist/seed.js
```
여러 번 실행해도 `id` 기준 upsert라 중복 생성되지 않습니다.

### 10. 동작 확인
```bash
curl http://cleanbrain.me:3000/api/health
```
브라우저로 `http://cleanbrain.me:3000` 접속 → Google 로그인 → 오늘의 30개 등이 정상 동작하는지 확인합니다.

### HTTPS로 전환하고 싶어지면
`deploy/Caddyfile`에서 `http://cleanbrain.me:3000`의 `http://`만 지우고(`cleanbrain.me:3000 { ... }`) 방화벽에 80을 추가로 열면(`ufw allow 80/tcp`) 됩니다 — 나머지(`.env`, Google Console)는 스킴만 `https://`로 바꾸면 그대로 재사용됩니다. Caddy가 포트 80을 통해 Let's Encrypt 인증서를 자동 발급/갱신합니다.

### 11. 로그 / 재기동 / 업데이트 배포
```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml logs -f api
docker compose --env-file .env -f deploy/docker-compose.prod.yml restart api

# 코드 업데이트 배포
git pull
docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d --build
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec api \
  node_modules/.bin/prisma migrate deploy --schema ../../prisma/schema.prisma
```

## Backup

PostgreSQL 데이터는 named volume(`speaking_core_pg`)에 저장됩니다. 백업 예시:

```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup_$(date +%Y%m%d).sql
```

## Study 기능 (Phase 2)

- **오늘의 30개 / 복습 / 신규 / 취약 항목**: 홈 화면의 모드 카드에서 진입 (`GET /api/study/{daily,due,new,weak}`)
- **카테고리 브라우징 / 검색 / 랜덤 학습**: `/browse` — 카테고리 필터, 한/영 검색, 무한 스크롤, "뜻 가리기" 토글, 순서대로/랜덤 학습 시작
- **스피킹 학습 모드 v1**: 카드에서 타이핑으로 회상 후 "정답 확인"으로 뜻/예문 노출 (마이크 인식은 Phase 3 검토 대상)
- **영어 발음 듣기**: 브라우저 `SpeechSynthesis` API
- **난이도 평가 4단계**: 다시(1)/어려움(2)/보통(3)/쉬움(4) → 서버의 SRS v1 스케줄러(`apps/api/src/study/scheduler/`)가 다음 복습일 계산. 알고리즘 교체를 위해 `REVIEW_SCHEDULER` DI 토큰으로 분리되어 있음
- **진행률 요약**: 홈 화면 상단 (전체/학습함/복습 대상/오늘 학습)

## Chunk 스피킹 드릴

SRS 기반 암기 복습(위 Study 기능)과는 별개의 메뉴입니다. 목적이 "기억"이 아니라 "산출 자동화"이기 때문에 서버가 다음 복습일을 계산하는 스케줄러 없이, 단순 반복/커버리지 기반으로 동작합니다.

- **콘텐츠**: `data/chunk_drill_v1.json` — 회화에서 자주 쓰이는 스피킹 Chunk(담화 표지, 의견/완곡 표현, 동의·반대, 되묻기, 이야기 연결어, 스몰토크, 부탁/제안, 강조, 비교 등) 100개. 학습 콘텐츠 원칙(`CLAUDE.md`)에 따라 canonical seed(`speaking_core_1350_seed_v2.json`)와는 완전히 분리된 독립 데이터셋이며, 실제 코퍼스 빈도가 아니라 정립된 formulaic-sequence/담화표지 연구에 기반해 큐레이션한 순위입니다(자세한 한계는 `data/chunk_drill_v1_manifest.json`의 `note` 참고). v2에서 빈도 코퍼스를 반영해 확장할 수 있습니다.
- **연습 방식**: 홈 화면의 별도 카드(🗣️ Chunk 스피킹 드릴)로 진입 → `GET /api/chunk-drill/set`으로 아직 안 다룬 항목을 우선(그다음 가장 오래 전에 연습한 항목 우선)으로 세트를 받아 카드 하나씩 진행. 카드가 뜨면 브라우저 `SpeechSynthesis`로 자동 반복 재생(1/3/5회 선택)되어 바로 따라 말하고, "다음"을 눌러 넘어갑니다. 세트를 다 돌면 `POST /api/chunk-drill/complete`로 완료 기록.
- **진행 기록**: `ChunkDrillProgress`(사용자별 `practiceCount`/`lastPracticedAt`)만 저장하는 경량 모델이며, `LearningProgress`/SRS 스케줄러와는 완전히 독립적입니다. 홈 화면에 "N/100 연습함 · 오늘 M개" 요약이 표시됩니다(`GET /api/chunk-drill/summary`).

## 남은 작업 (Phase 3 후보)

- 로그인 상태를 유지한 Playwright 등 자동화된 E2E UI 테스트
- 마이크 기반 발음 인식 스피킹 모드
- Progress 캘린더 시각화 UI (API는 구현됨: `GET /api/progress/calendar`)
- PWA 오프라인 학습 진도 동기화
- Chunk 스피킹 드릴 데이터셋을 실제 코퍼스 빈도 기반으로 확장 (v2)
