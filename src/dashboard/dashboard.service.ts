import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DashboardStats {
  brands: number;
  outfits: number;
  articles: number;
  users: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const [brands, outfits, articles, users] = await Promise.all([
      this.prisma.brand.count(),
      this.prisma.outfit.count(),
      this.prisma.article.count(),
      this.prisma.user.count(),
    ]);

    return { brands, outfits, articles, users };
  }
}
