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
`business_profile` (singleton, no list/detail screen). `articles` is
independent — no relation to `outfits` or any other table (this reverses
an earlier plan decision; don't reintroduce an `outfitId` FK).

## Seed data

`prisma/seed.ts` seeds the `business_profile` singleton and one `ADMIN`
user (`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`, default
`admin@fashion-ai.local` / `admin123`). The other 4 tables are meant to be
populated through the admin wizards (Days 4/5) and a real content pass
(Day 10), not hand-written fixtures.

## Auth & guards

- JWT auth (`@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`), single
  `ADMIN` role, `POST /auth/login` issues a Bearer token. `AuthModule` is
  `@Global()` and exports a **configured** `PassportModule.register({
  defaultStrategy: 'jwt' })` — bare `PassportModule` (no `.register()`)
  provides nothing and `JwtAuthGuard` fails to resolve `AuthModuleOptions`
  wherever it's used; don't "simplify" that import back to a bare
  `PassportModule`.
- `JwtAuthGuard` (`src/auth/guards/`) protects: the entire `UsersController`
  and the entire `DashboardController` (admin/staff accounts and internal
  aggregate stats have no public-storefront reason to exist), and the
  POST/PATCH/DELETE routes on Brands/Outfits/Articles/BusinessProfile — GET
  routes on those stay public because the storefront (`fashion-web`) reads
  them unauthenticated. Follow this read-public/write-guarded split for any
  new *content* entity controller; guard the whole controller instead only
  for admin-internal resources like Users/Dashboard.
- Passwords are hashed with `bcryptjs` (pure JS, no native build step) —
  `UsersService` strips `passwordHash` from every returned shape via a
  `SafeUser` type; only `findByEmail` (used by `AuthService`) returns the
  raw row.

## Cross-cutting: filter, interceptor, validation, Swagger

- `AllExceptionsFilter` (`src/common/filters/`, global via `APP_FILTER`)
  maps Prisma's known errors (`P2002` unique conflict -> 409, `P2025` not
  found -> 404, `P2003` bad FK -> 400) instead of letting them surface as
  raw 500s — extend `fromPrismaError` there for any new Prisma error code
  a service starts relying on, rather than catching `PrismaClientKnownRequestError`
  ad hoc inside individual services.
- `LoggingInterceptor` (`src/common/interceptors/`, global via
  `APP_INTERCEPTOR`) logs `METHOD url +Nms` for every request.
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true,
  transform: true })` in `main.ts` — DTOs are the only validation layer;
  don't re-validate in services.
- Swagger UI at `/api` (`DocumentBuilder` + `.addBearerAuth()` in
  `main.ts`); `nest-cli.json` has the `@nestjs/swagger` CLI plugin enabled
  so DTO shapes are inferred from TS types without hand-writing
  `@ApiProperty` on every field of every DTO (it's still added explicitly
  where an example/enum/default is worth documenting).

## Dashboard stats (Day 5)

`GET /dashboard/stats` (`src/dashboard/`) returns `{ brands, outfits,
articles, users }` — plain `Promise.all([...prisma.<model>.count()])`, no
transaction needed since these are independent reads, not writes. This is
the admin Dashboard's KPI-card data; the *business_profile* KPI form on
that same page is unrelated and already served by the existing
`BusinessProfileController` (Day 2) — don't duplicate that here.

## File uploads

- `UploadsModule` (`src/uploads/`) — `POST /uploads` (guarded, `multipart/form-data`,
  field name `file`) saves to local disk (`UPLOADS_DIR` = `<repo>/uploads`,
  gitignored, created at boot in `main.ts` via `mkdirSync`) and returns an
  **absolute** URL (`http://<host>/uploads/<uuid>.<ext>`) built from the
  request itself, not a relative path. Files are served back via
  `app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' })` — this requires
  `NestFactory.create<NestExpressApplication>(...)`, not the default
  platform-agnostic type, or `useStaticAssets` won't exist on `app`.
- `fileFilter` only allows `image/png|jpeg|webp`; `limits.fileSize` caps at
  8 MB. No cloud storage per the plan (§4) — this is intentionally simple.
- **`@IsUrl()` gotcha**: validator.js's default `IsUrl()` rejects
  `http://localhost:3000/...` (no TLD). `Outfit.imageUrl` and
  `Brand.logoUrl` both use `@IsUrl({ require_tld: false })` because they
  can legitimately hold a local upload URL; `Brand.website` stays strict
  (`@IsUrl()`) since it's always meant to be a real public URL. If a new
  DTO field will ever hold an uploads-endpoint URL, it needs the same
  `require_tld: false` — this bug silently 400s every wizard/logo-upload
  submission otherwise, and is easy to miss because it only reproduces
  with a real localhost URL, not with `https://example.com` in Swagger.

## Skills

- `.agents/skills/` (symlinked from `.claude/skills/`) — official Prisma
  skills installed by `prisma init` (CLI reference, client API, Postgres
  setup, driver adapters, etc.). Consult these before assuming Prisma 5/6
  behavior; this project is on Prisma 7, which changed config file location,
  the client generator, and how the client connects.
- `nest-crud-module` (`.claude/skills/`) — scaffolds a CRUD
  module (controller + service + DTOs, wired to `PrismaService`) matching
  this repo's conventions, including the read-public/write-guarded pattern
  above. Use it instead of hand-writing the next entity's boilerplate.
