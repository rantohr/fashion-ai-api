---
name: nest-crud-module
description: Scaffold a NestJS CRUD module (module + controller + service + DTOs) for one Prisma model in fashion-ai-api, wired to the global PrismaService. Use when adding CRUD for Brands, Outfits, Articles, BusinessProfile, or any future entity. Triggers on "add a CRUD module for X", "scaffold the X endpoints", "generate a resource for X".
metadata:
  type: project-skill
---

# Nest CRUD Module (fashion-ai-api)

Generates one feature module for a single Prisma model, following this
repo's conventions: ESM relative imports with `.js` extensions, `PrismaService`
injected from the global `PrismaModule` (no need to import it), one module per
entity under `src/<entity>/`.

## Steps

1. Confirm the Prisma model exists in `prisma/schema.prisma` and the client is
   generated (`npm run prisma:generate`). Read the model's fields before
   writing DTOs so they match exactly.
2. Create `src/<entity>/<entity>.module.ts`, `.controller.ts`, `.service.ts`,
   and a `dto/` folder with `create-<entity>.dto.ts` +
   `update-<entity>.dto.ts`.
3. If `class-validator` / `class-transformer` are not yet dependencies, install
   them (`npm install class-validator class-transformer`) and use decorators
   for DTO validation. If a global `ValidationPipe` isn't wired in `main.ts`
   yet, add one (`app.useGlobalPipes(new ValidationPipe({ whitelist: true }))`)
   rather than validating manually per-route.
4. Service methods should be thin wrappers over `this.prisma.<model>.*` —
   don't reinvent query building. Reach for a `$transaction` only for
   multi-write operations (e.g. a future batch-create), not single CRUD calls.
5. Controller routes follow REST conventions: `GET /<entity>` (list),
   `GET /<entity>/:id`, `POST /<entity>`, `PATCH /<entity>/:id`,
   `DELETE /<entity>/:id`. Use the plural, kebab-case route segment matching
   the Prisma `@@map` table name's spirit (e.g. `outfits`, not `Outfit`).
6. Register the new module in `src/app.module.ts`'s `imports`.
7. Sanity check: `npm run build` (type-check) before considering it done —
   this project has no e2e test scaffolding for new modules yet, so a clean
   build is the minimum bar.

## Example shape

```ts
// src/brands/brands.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.brand.findMany();
  }

  findOne(id: string) {
    return this.prisma.brand.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateBrandDto) {
    return this.prisma.brand.create({ data: dto });
  }

  update(id: string, dto: UpdateBrandDto) {
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.brand.delete({ where: { id } });
  }
}
```

## Don't

- Don't add auth Guards to these routes yet unless explicitly asked — JWT
  auth is a separate, later piece of work (Guards for `users` only, not
  storefront-facing reads).
- Don't hand-roll pagination/filtering logic beyond what's asked — Prisma's
  `skip`/`take`/`where` cover the plan's "filterable/paginated" catalogue
  requirement without a custom query builder.
