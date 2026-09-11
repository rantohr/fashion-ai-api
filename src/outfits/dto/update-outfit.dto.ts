import { PartialType } from '@nestjs/swagger';
import { CreateOutfitDto } from './create-outfit.dto.js';

export class UpdateOutfitDto extends PartialType(CreateOutfitDto) {}
