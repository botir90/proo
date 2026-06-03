import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsEmail, IsInt, IsNumber, IsOptional, IsString, Min, MinLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeacherDto {
  @ApiProperty() @IsString() @MinLength(2) firstName: string;
  @ApiProperty() @IsString() @MinLength(2) lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password too weak' })
  password: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty({ type: [String], example: ['Math', 'Physics'] })
  @IsArray()
  @IsString({ each: true })
  subjects: string[];
  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary: number;
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  experience?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
}

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {}
