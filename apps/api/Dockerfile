# Build context is the monorepo root (see deploy/docker-compose.prod.yml).
# Debian (not Alpine) on purpose: Prisma's OpenSSL-3.0 auto-detection is
# unreliable on current Alpine/musl releases (see prisma/schema.prisma).
FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile --filter @speaking-core/api...

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @speaking-core/api exec prisma generate --schema ../../prisma/schema.prisma
RUN pnpm --filter @speaking-core/api build
# Precompiles prisma/seed.ts to plain JS (via apps/api/tsconfig.seed.json,
# which can see apps/api's own @types/node) so seeding a deployed container
# needs nothing beyond `node` (no tsx/ts-node at runtime, no SSH tunnel).
RUN pnpm --filter @speaking-core/api exec tsc --project tsconfig.seed.json

FROM base AS runtime
ENV NODE_ENV=production
# wget is used by the Docker healthcheck; openssl lets Prisma detect its
# OpenSSL-3.0 engine correctly (node:20-slim omits both by default).
RUN apt-get update && apt-get install -y --no-install-recommends wget openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/prisma-dist ./prisma-dist
COPY prisma ./prisma
COPY data ./data
WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
