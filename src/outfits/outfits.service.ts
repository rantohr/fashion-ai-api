import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BatchCreateOutfitDto } from './dto/batch-create-outfit.dto.js';
import { CreateOutfitDto } from './dto/create-outfit.dto.js';
import { UpdateOutfitDto } from './dto/update-outfit.dto.js';

@Injectable()
export class OutfitsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.outfit.findMany({ include: { brand: true }, orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.outfit.findUniqueOrThrow({ where: { id }, include: { brand: true } });
  }

  findBySlug(slug: string) {
    return this.prisma.outfit.findUniqueOrThrow({ where: { slug }, include: { brand: true } });
  }

  create(dto: CreateOutfitDto) {
    return this.prisma.outfit.create({ data: dto });
  }

  // The one real DB-transaction example the plan asks for: every outfit is
  // created, or none are, in a single round trip to Postgres.
  batchCreate(dto: BatchCreateOutfitDto) {
    return this.prisma.$transaction(dto.outfits.map((outfit) => this.prisma.outfit.create({ data: outfit })));
  }

  update(id: string, dto: UpdateOutfitDto) {
    return this.prisma.outfit.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.outfit.delete({ where: { id } });
  }
}
