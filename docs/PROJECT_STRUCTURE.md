# Project Structure

```text
speaking-core-1350/
├─ CLAUDE.md
├─ README.md
├─ package.json
├─ pnpm-workspace.yaml
├─ .env.example
├─ apps/
│  ├─ web/                     # Vue 3 + Vite + PWA
│  │  ├─ src/
│  │  │  ├─ api/
│  │  │  ├─ components/
│  │  │  ├─ composables/
│  │  │  ├─ router/
│  │  │  ├─ stores/
│  │  │  └─ views/
│  │  └─ Dockerfile
│  └─ api/                     # NestJS
│     ├─ src/
│     │  ├─ auth/
│     │  ├─ users/
│     │  ├─ learning-items/
│     │  ├─ study/
│     │  ├─ progress/
│     │  ├─ health/
│     │  └─ prisma/
│     └─ Dockerfile
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ data/
│  └─ speaking_core_1350_seed_v2.json
├─ deploy/
│  ├─ docker-compose.prod.yml
│  └─ Caddyfile
└─ docs/
   ├─ IMPLEMENTATION_SPEC.md
   └─ DATA_QUALITY_REPORT.md
```

Keep the implementation monolithic at the service level for v1. Redis, queues and microservices are intentionally excluded.
