import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BusinessProfileService } from './business-profile.service.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';

// Singleton resource - no list/detail, just the Dashboard's edit form (plan §3/§6).
@ApiTags('business-profile')
@Controller('business-profile')
export class BusinessProfileController {
  constructor(private readonly businessProfileService: BusinessProfileService) {}

  @Get()
  get() {
    return this.businessProfileService.get();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@Body() dto: UpdateBusinessProfileDto) {
    return this.businessProfileService.update(dto);
  }
}
