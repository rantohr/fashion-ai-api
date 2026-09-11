import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { UpdateArticleDto } from './dto/update-article.dto.js';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.article.findMany({ include: { outfit: true }, orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.article.findUniqueOrThrow({ where: { id }, include: { outfit: true } });
  }

  findBySlug(slug: string) {
    return this.prisma.article.findUniqueOrThrow({ where: { slug }, include: { outfit: true } });
  }

  create(dto: CreateArticleDto) {
    return this.prisma.article.create({ data: dto });
  }

  update(id: string, dto: UpdateArticleDto) {
    return this.prisma.article.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.article.delete({ where: { id } });
  }
}
