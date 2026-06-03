import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty() @IsUUID() studentId: string;
  @ApiProperty() @IsUUID() groupId: string;
  @ApiProperty({ example: 1200000 }) @IsNumber() @Min(0) @Type(() => Number) amount: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) @Type(() => Number) paidAmount?: number;
  @ApiProperty({ example: '2024-02-01' }) @IsDateString() dueDate: string;
  @ApiProperty({ example: 1, description: '1-12' }) @IsInt() @Min(1) @Max(12) @Type(() => Number) month: number;
  @ApiProperty({ example: 2024 }) @IsInt() @Min(2020) @Type(() => Number) year: number;
  @ApiPropertyOptional({ enum: PaymentMethod }) @IsOptional() @IsEnum(PaymentMethod) method?: PaymentMethod;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) paidAmount?: number;
  @ApiPropertyOptional({ enum: PaymentStatus }) @IsOptional() @IsEnum(PaymentStatus) status?: PaymentStatus;
  @ApiPropertyOptional({ enum: PaymentMethod }) @IsOptional() @IsEnum(PaymentMethod) method?: PaymentMethod;
  @ApiPropertyOptional() @IsOptional() @IsDateString() paidDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class PaymentQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() studentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional({ enum: PaymentStatus }) @IsOptional() @IsEnum(PaymentStatus) status?: PaymentStatus;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) month?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) year?: number;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
}
