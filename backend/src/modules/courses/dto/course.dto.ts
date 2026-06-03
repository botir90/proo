import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({ example: 'English A1' }) @IsString() @MinLength(2) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ example: 1200000 }) @IsNumber() @Min(0) @Type(() => Number) price: number;
  @ApiProperty({ example: 3, description: 'Duration in months' }) @IsInt() @Min(1) @Type(() => Number) duration: number;
  @ApiPropertyOptional({ example: '#6366f1' }) @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
