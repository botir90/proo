import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { HomeworkService } from './homework.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const hwStorage = diskStorage({
  destination: './uploads/homework',
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

const fileFilter = (_: any, file: Express.Multer.File, cb: any) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
  cb(null, allowed.test(extname(file.originalname).toLowerCase()));
};

@ApiTags('Homework')
@ApiBearerAuth('JWT-auth')
@Controller('homework')
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Vazifa yaratish (fayl bilan)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: hwStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }))
  create(
    @Body() dto: { groupId: string; title: string; description?: string; dueDate?: string },
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileUrl = file ? `homework/${file.filename}` : undefined;
    return this.homeworkService.create(dto, userId, fileUrl);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Guruh vazifalari' })
  findByGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.homeworkService.findByGroup(groupId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: "Student o'z vazifalari" })
  findMyHomeworks(@CurrentUser('id') userId: string) {
    return this.homeworkService.findMyHomeworks(userId);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Vazifa topshirish (fayl bilan)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: hwStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }))
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { note?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileUrl = file ? `homework/${file.filename}` : undefined;
    return this.homeworkService.submitHomework(id, userId, body.note, fileUrl);
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
  @ApiOperation({ summary: "Vazifa o'chirish" })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.homeworkService.delete(id, userId);
  }
}
