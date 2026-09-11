import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import { Season, OutfitStatus } from '../../generated/prisma/enums.js';

export class CreateOutfitDto {
  @ApiProperty()
  @IsString()
  brandId!: string;

  @ApiProperty({ example: 'Midnight Trench Coat' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'midnight-trench-coat' })
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, and dash-separated',
  })
  slug!: string;

  @ApiProperty({ example: 'outerwear' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 249.99 })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: Season, required: false, default: Season.ALL_SEASON })
  @IsOptional()
  @IsEnum(Season)
  season?: Season;

  @ApiProperty({ enum: OutfitStatus, required: false, default: OutfitStatus.DRAFT })
  @IsOptional()
  @IsEnum(OutfitStatus)
  status?: OutfitStatus;
}
