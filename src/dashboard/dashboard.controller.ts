import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DashboardService } from './dashboard.service.js';

// Admin-only aggregate view - unlike Brands/Outfits/Articles there's no
// public-storefront reason to expose this, so the whole controller is
// guarded (same pattern as UsersController) rather than just the writes.
@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }
}
