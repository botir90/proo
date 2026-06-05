import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { QuizService } from './quiz.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quiz')
@ApiBearerAuth('JWT-auth')
@Controller('quiz')
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Test yaratish' })
  create(
    @Body() dto: {
      groupId: string; title: string; description?: string; timeLimit?: number;
      questions: { question: string; options: string[]; answer: number; order?: number }[];
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.quizService.create(dto, userId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Guruh testlari' })
  findByGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.quizService.findByGroup(groupId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student testlari' })
  findMyQuizzes(@CurrentUser('id') userId: string) {
    return this.quizService.findMyQuizzes(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Test ma\'lumotlari (savollar bilan)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.findOne(id);
  }

  @Get(':id/results')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Test natijalari' })
  getResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.getResults(id);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Test topshirish' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { answers: Record<string, number> },
  ) {
    return this.quizService.submitAttempt(id, userId, body.answers);
  }

  @Patch(':id/toggle')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Test faollashtirishni o\'zgartirish' })
  toggle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.quizService.toggleActive(id, userId);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Test o\'chirish' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.quizService.delete(id, userId);
  }
}
