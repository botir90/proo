import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Lessons')
@ApiBearerAuth('JWT-auth')
@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Yangi dars yaratish' })
  create(@Body() dto: CreateLessonDto, @CurrentUser('id') userId: string) {
    return this.lessonsService.create(dto, userId);
  }

  @Get('my')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "O'qituvchi o'z darslarini ko'rish" })
  findMyLessons(@CurrentUser('id') userId: string) {
    return this.lessonsService.findMyLessons(userId);
  }

  @Get('student')
  @Roles(Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "O'quvchi o'z darslarini ko'rish" })
  findStudentLessons(@CurrentUser('id') userId: string) {
    return this.lessonsService.findStudentLessons(userId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Guruh darslari' })
  findByGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.lessonsService.findByGroup(groupId);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Darsni yangilash' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lessonsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: "Darsni o'chirish" })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.lessonsService.remove(id, userId);
  }
}
