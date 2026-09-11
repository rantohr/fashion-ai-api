@.docs/fashion-ai-project-plan.md

# fashion-ai-api

NestJS + Prisma backend for the Fashion AI Showcase (see the full plan above for
business context, scope, and the day-by-day build order). This repo owns the
Postgres database and is the only place migrations/seed run.

## Stack & conventions

- NestJS 12, ESM (`"type": "module"` in package.json) — relative imports need
  explicit `.js` extensions (`nodenext` module resolution).
- Prisma 7: config lives in `prisma.config.ts` (not `schema.prisma`), the
  client generator requires an explicit `output` path (`src/generated/prisma`,
  gitignored, regenerate with `npm run prisma:generate`), and connecting
  requires a driver adapter (`@prisma/adapter-pg` + `pg`) — there is no
  bundled query engine binary anymore. See `PrismaService` for the pattern.
- `PrismaModule` is `@Global()` — inject `PrismaService` directly into any
  feature module without re-importing it.
- Vitest for tests (not Jest), oxlint for linting.

## Local database

Postgres runs via Docker Compose, mapped to **host port 5438** (not 5432 —
a native Postgres service already owns 5432 on this machine, and 5433-5437
are used by other local Docker projects; keep `docker-compose.yml` and
`DATABASE_URL` in `.env` in sync if this ever needs to change).

```bash
npm run db:up             # start Postgres (docker compose up -d)
npm run prisma:migrate     # create + apply a migration (prisma migrate dev)
npm run prisma:generate     # regenerate the Prisma client after schema changes
npm run prisma:seed         # run prisma/seed.ts
npm run prisma:studio       # Prisma Studio GUI
```

Prisma will block destructive commands (`migrate reset`, `db push
--force-reset`) when it detects an AI agent, until it has explicit consent —
see `.agents/skills/prisma-cli/references/agent-safety.md`. Never infer that
consent from an unrelated approval earlier in a session.

## Data model

6 tables (see `prisma/schema.prisma`): `brands`, `outfits`, `articles`,
`users` (admin/staff only — no storefront accounts), `scenarios`,
`business_profile` (singleton, no list/detail screen). `articles.outfitId`
is required — an article is always written from an outfit.

## Seed data

`prisma/seed.ts` is a skeleton: only `business_profile` is seeded for now.
The other 5 tables are meant to be populated through the admin wizards
(Days 4/5) and a real content pass (Day 10), not hand-written fixtures —
see the TODO comments in the seed file before adding bulk fixture data here.

## Skills

- `.agents/skills/` (symlinked from `.claude/skills/`) — official Prisma
  skills installed by `prisma init` (CLI reference, client API, Postgres
  setup, driver adapters, etc.). Consult these before assuming Prisma 5/6
  behavior; this project is on Prisma 7, which changed config file location,
  the client generator, and how the client connects.
- `nest-crud-module` (`.claude/skills/`) — scaffolds a CRUD
  module (controller + service + DTOs, wired to `PrismaService`) matching
  this repo's conventions. Use it instead of hand-writing the next entity's
  boilerplate (Day 2: Brands/Outfits/Articles/BusinessProfile).
