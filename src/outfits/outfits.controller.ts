import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BatchCreateOutfitDto } from './dto/batch-create-outfit.dto.js';
import { CreateOutfitDto } from './dto/create-outfit.dto.js';
import { UpdateOutfitDto } from './dto/update-outfit.dto.js';
import { OutfitsService } from './outfits.service.js';

@ApiTags('outfits')
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Get()
  findAll() {
    return this.outfitsService.findAll();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.outfitsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.outfitsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOutfitDto) {
    return this.outfitsService.create(dto);
  }

  // Transactional batch-create - the Day 2 transaction example, later reused
  // by the outfit wizard's crop-and-batch-create step (Day 4).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('batch')
  batchCreate(@Body() dto: BatchCreateOutfitDto) {
    return this.outfitsService.batchCreate(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOutfitDto) {
    return this.outfitsService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.outfitsService.remove(id);
  }
}
