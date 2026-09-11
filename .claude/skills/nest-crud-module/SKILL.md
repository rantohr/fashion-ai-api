---
name: nest-crud-module
description: Scaffold a NestJS CRUD module (module + controller + service + DTOs) for one Prisma model in fashion-ai-api, wired to the global PrismaService, with the read-public/write-guarded auth pattern already applied. Use when adding CRUD for a new entity. Triggers on "add a CRUD module for X", "scaffold the X endpoints", "generate a resource for X".
metadata:
  type: project-skill
---

# Nest CRUD Module (fashion-ai-api)

Generates one feature module for a single Prisma model, following this
repo's conventions: ESM relative imports with `.js` extensions, `PrismaService`
injected from the global `PrismaModule` (no need to import it), one module per
entity under `src/<entity>/`. Use `src/brands/`, `src/outfits/`, or
`src/articles/` as the reference implementation.

## Steps

1. Confirm the Prisma model exists in `prisma/schema.prisma` and the client is
   generated (`npm run prisma:generate`). Read the model's fields before
   writing DTOs so they match exactly (types, optionality, enums).
2. Create `src/<entity>/<entity>.module.ts`, `.controller.ts`, `.service.ts`,
   and a `dto/` folder with `create-<entity>.dto.ts` +
   `update-<entity>.dto.ts` (the latter is just
   `export class Update<Entity>Dto extends PartialType(Create<Entity>Dto) {}`
   from `@nestjs/swagger`).
3. `class-validator`/`class-transformer` are already dependencies — annotate
   every DTO field with the matching decorator (`@IsString`, `@IsEnum`,
   `@IsOptional`, etc.); the global `ValidationPipe` in `main.ts`
   (`whitelist: true, forbidNonWhitelisted: true, transform: true`) is the
   only validation layer, don't re-validate in the service.
4. Service methods should be thin wrappers over `this.prisma.<model>.*` —
   don't reinvent query building, and don't catch Prisma errors here:
   `AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`)
   already maps `P2002`/`P2025`/`P2003` to sane HTTP responses globally; add
   a case there if a new Prisma error code needs mapping. Reach for
   `$transaction` only for genuine multi-write operations (see
   `OutfitsService.batchCreate` for the pattern), not single CRUD calls.
5. Controller routes follow REST conventions: `GET /<entity>` (list),
   `GET /<entity>/:id`, `POST /<entity>`, `PATCH /<entity>/:id`,
   `DELETE /<entity>/:id`. Use the plural, kebab-case route segment matching
   the Prisma `@@map` table name's spirit (e.g. `outfits`, not `Outfit`).
6. **Auth split** (see `BrandsController` for the exact pattern): leave GET
   routes public (`fashion-web` reads them unauthenticated) and guard every
   POST/PATCH/DELETE route individually with
   `@ApiBearerAuth() @UseGuards(JwtAuthGuard)` from
   `../auth/guards/jwt-auth.guard.js`. Only guard an entire controller
   (`@UseGuards` at the class level) for a resource that's sensitive even to
   read, the way `UsersController` does — that should be the exception, not
   the default.
7. Add `@ApiTags('<entity>')` to the controller. Field-level `@ApiProperty`
   is optional (the `@nestjs/swagger` CLI plugin infers most of it from the
   DTO's TS types) but worth adding for an `example`, `enum`, or `default`
   that documents intent Swagger can't infer.
8. Register the new module in `src/app.module.ts`'s `imports`.
9. Sanity check before considering it done: `npm run build`, `npm run lint`,
   and a manual smoke test (login via `POST /auth/login`, then exercise the
   new routes with and without the Bearer token) — there's no per-module
   test scaffolding yet, so this is the minimum bar.

## Example shape

```ts
// src/brands/brands.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BrandsService } from './brands.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  // ...PATCH/DELETE follow the same @ApiBearerAuth() + @UseGuards(JwtAuthGuard) pattern
}
```

## Don't

- Don't leave new mutation routes unguarded "for now" — every existing
  entity controller guards its writes; a new one that doesn't is a
  regression, not a simplification.
- Don't hand-roll pagination/filtering logic beyond what's asked — Prisma's
  `skip`/`take`/`where` cover the plan's "filterable/paginated" catalogue
  requirement without a custom query builder.
- Don't add `try/catch` around Prisma calls to translate errors yourself —
  extend `AllExceptionsFilter` instead, so every module gets the mapping.
