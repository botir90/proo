import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { GroupStatus } from '@prisma/client';

export class CreateGroupDto {
  @ApiProperty({ example: 'English A1 - Group 1' }) @IsString() @MinLength(2) name: string;
  @ApiProperty() @IsUUID() courseId: string;
  @ApiProperty() @IsUUID() teacherId: string;
  @ApiProperty({ example: '2024-01-15' }) @IsDateString() startDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional({ example: 'Mon, Wed, Fri 14:00-16:00' }) @IsOptional() @IsString() schedule?: string;
  @ApiPropertyOptional({ example: 'Room 101' }) @IsOptional() @IsString() room?: string;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @IsInt() @Min(1) @Type(() => Number) maxStudents?: number;
  @ApiPropertyOptional({ enum: GroupStatus }) @IsOptional() @IsEnum(GroupStatus) status?: GroupStatus;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}

export class AddStudentToGroupDto {
  @ApiProperty() @IsUUID() studentId: string;
}
