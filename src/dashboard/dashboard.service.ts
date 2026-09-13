import { Injectable } from '@nestjs/common';
import { ArticleStatus, OutfitStatus, Season } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CountBreakdown<T extends string> {
  status: T;
  count: number;
}

export interface SeasonBreakdown {
  season: Season;
  count: number;
}

export interface TopBrand {
  id: string;
  name: string;
  slug: string;
  outfitCount: number;
}

export interface RecentOutfit {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface RecentArticle {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
}

export interface DashboardStats {
  totals: {
    brands: number;
    outfits: number;
    articles: number;
    users: number;
    scenarios: number;
  };
  outfitsByStatus: CountBreakdown<OutfitStatus>[];
  outfitsBySeason: SeasonBreakdown[];
  articlesByStatus: CountBreakdown<ArticleStatus>[];
  topBrands: TopBrand[];
  pricing: { min: number | null; max: number | null; avg: number | null };
  recentOutfits: RecentOutfit[];
  recentArticles: RecentArticle[];
}

const TOP_BRANDS_LIMIT = 5;
const RECENT_ITEMS_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const [
      brands,
      outfits,
      articles,
      users,
      scenarios,
      outfitsByStatusRaw,
      outfitsBySeasonRaw,
      articlesByStatusRaw,
      topBrandsRaw,
      priceAgg,
      recentOutfits,
      recentArticles,
    ] = await Promise.all([
      this.prisma.brand.count(),
      this.prisma.outfit.count(),
      this.prisma.article.count(),
      this.prisma.user.count(),
      this.prisma.scenario.count(),
      this.prisma.outfit.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.outfit.groupBy({ by: ['season'], _count: { _all: true } }),
      this.prisma.article.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.brand.findMany({
        select: { id: true, name: true, slug: true, _count: { select: { outfits: true } } },
        orderBy: { outfits: { _count: 'desc' } },
        take: TOP_BRANDS_LIMIT,
      }),
      this.prisma.outfit.aggregate({ _min: { price: true }, _max: { price: true }, _avg: { price: true } }),
      this.prisma.outfit.findMany({
        select: { id: true, name: true, slug: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ITEMS_LIMIT,
      }),
      this.prisma.article.findMany({
        select: { id: true, title: true, slug: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ITEMS_LIMIT,
      }),
    ]);

    // groupBy only returns rows for statuses/seasons that actually occur -
    // fill in every possible enum value so the UI can always render a
    // complete breakdown (e.g. "Archived: 0") instead of a missing row.
    const outfitStatusCounts = new Map(outfitsByStatusRaw.map((row) => [row.status, row._count._all]));
    const outfitSeasonCounts = new Map(outfitsBySeasonRaw.map((row) => [row.season, row._count._all]));
    const articleStatusCounts = new Map(articlesByStatusRaw.map((row) => [row.status, row._count._all]));

    return {
      totals: { brands, outfits, articles, users, scenarios },
      outfitsByStatus: Object.values(OutfitStatus).map((status) => ({
        status,
        count: outfitStatusCounts.get(status) ?? 0,
      })),
      outfitsBySeason: Object.values(Season).map((season) => ({
        season,
        count: outfitSeasonCounts.get(season) ?? 0,
      })),
      articlesByStatus: Object.values(ArticleStatus).map((status) => ({
        status,
        count: articleStatusCounts.get(status) ?? 0,
      })),
      topBrands: topBrandsRaw
        .filter((brand) => brand._count.outfits > 0)
        .map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug, outfitCount: brand._count.outfits })),
      pricing: {
        min: priceAgg._min.price ? Number(priceAgg._min.price) : null,
        max: priceAgg._max.price ? Number(priceAgg._max.price) : null,
        avg: priceAgg._avg.price ? Number(priceAgg._avg.price) : null,
      },
      recentOutfits,
      recentArticles,
    };
  }
}
