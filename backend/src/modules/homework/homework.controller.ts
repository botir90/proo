import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { HomeworkService } from './homework.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Homework')
@ApiBearerAuth('JWT-auth')
@Controller('homework')
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Vazifa yaratish' })
  create(
    @Body() dto: { groupId: string; title: string; description?: string; dueDate?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.homeworkService.create(dto, userId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Guruh vazifalari' })
  findByGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.homeworkService.findByGroup(groupId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student o\'z vazifalari' })
  findMyHomeworks(@CurrentUser('id') userId: string) {
    return this.homeworkService.findMyHomeworks(userId);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Vazifa topshirish' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { note?: string },
  ) {
    return this.homeworkService.submitHomework(id, userId, body.note);
  }

  @Get(':id/submissions')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Vazifa topshiriqlari' })
  getSubmissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeworkService.getSubmissions(id);
  }

  @Patch('submissions/:id/grade')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Ball berish' })
  grade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { points: number },
    @CurrentUser('id') userId: string,
  ) {
    return this.homeworkService.gradeSubmission(id, body.points, userId);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Vazifa o\'chirish' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.homeworkService.delete(id, userId);
  }
}
