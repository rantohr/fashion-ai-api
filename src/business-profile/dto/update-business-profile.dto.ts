import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateBusinessProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  monthlyRevenue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  monthlyCosts?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  monthlyCustomers?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  monthlySalesVolume?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  marketingBudget?: number;
}
