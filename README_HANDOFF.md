# Speaking Core 1350 - Claude Code Handoff Pack

This package is intended to be copied into a new Git repository and opened with Claude Code.

## Start here
1. Read `CLAUDE.md`.
2. Read `docs/IMPLEMENTATION_SPEC.md`.
3. Treat `data/speaking_core_1350_seed_v2.json` as canonical learning content.
4. Use `database/schema.prisma` and deployment examples as starting contracts, not generated production code.
5. Ask Claude Code to implement in the order defined in `CLAUDE.md`.

## Validate the dataset
```bash
python scripts/validate_seed.py
```

## Suggested first Claude Code command
```text
Read CLAUDE.md and docs/IMPLEMENTATION_SPEC.md first. Inspect the repository and implement Phase 1 only: pnpm monorepo scaffold, NestJS API, Vue 3 PWA shell, Prisma integration, local Docker Compose, deterministic seed import, and seed validation. Do not alter the canonical learning dataset. Run tests/validation and update README with exact commands before moving to Phase 2.
```

## Notes
The provided Compose/Caddy/Prisma files are implementation starters. Claude Code should adapt them to the generated monorepo while preserving the contracts.
