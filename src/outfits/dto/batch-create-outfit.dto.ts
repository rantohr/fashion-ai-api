import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { CreateOutfitDto } from './create-outfit.dto.js';

// Backs the one real DB-transaction example (Day 2) and the outfit wizard's
// batch-create step (Day 4): all outfits are created together, or none are.
export class BatchCreateOutfitDto {
  @ApiProperty({ type: [CreateOutfitDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateOutfitDto)
  @ArrayMinSize(1)
  outfits!: CreateOutfitDto[];
}
