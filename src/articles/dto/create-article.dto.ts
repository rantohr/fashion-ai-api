import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { ArticleStatus } from '../../generated/prisma/enums.js';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  outfitId!: string;

  @ApiProperty({ example: 'Styling the Midnight Trench for Fall' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'styling-the-midnight-trench-for-fall' })
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, and dash-separated',
  })
  slug!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ description: 'Markdown content' })
  @IsString()
  content!: string;

  @ApiProperty({ enum: ArticleStatus, required: false, default: ArticleStatus.DRAFT })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
