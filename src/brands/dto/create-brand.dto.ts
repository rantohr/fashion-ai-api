import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Acme Apparel' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'acme-apparel' })
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, and dash-separated',
  })
  slug!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  // require_tld: false - the uploads endpoint returns http://localhost:PORT/...
  // URLs in local dev, which validator.js's default IsUrl() rejects for
  // lacking a TLD. `website` below stays strict since it's always meant to
  // be a real public URL, not a local upload.
  @IsUrl({ require_tld: false })
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  website?: string;
}
