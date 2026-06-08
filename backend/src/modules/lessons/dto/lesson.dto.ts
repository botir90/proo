import { IsString, IsOptional, IsDateString, IsInt, IsEnum, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LessonStatus } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  lessonDate: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @ApiPropertyOptional({ enum: LessonStatus })
  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;
}
