import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';

const SINGLETON_ID = 'default';

@Injectable()
export class BusinessProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // Singleton row - normally seeded (prisma/seed.ts), but upsert here too so
  // the API never 404s against a freshly migrated, unseeded database.
  get() {
    return this.prisma.businessProfile.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: {
        id: SINGLETON_ID,
        shopName: 'Fashion AI Showcase',
        monthlyRevenue: 0,
        monthlyCosts: 0,
        monthlyCustomers: 0,
        monthlySalesVolume: 0,
        marketingBudget: 0,
      },
    });
  }

  async update(dto: UpdateBusinessProfileDto) {
    await this.get();
    return this.prisma.businessProfile.update({ where: { id: SINGLETON_ID }, data: dto });
  }
}
