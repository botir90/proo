import { Controller, Get, Post, Body, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto, AttendanceQueryDto } from './dto/attendance.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.TEACHER)
  @ApiOperation({ summary: 'Take attendance for a group' })
  create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: any) {
    // Teacher o'z ID sini ishlatadi, Admin/Manager esa guruh o'qituvchisini
    return this.attendanceService.createAttendance(dto, user.teacherProfile?.id, dto.groupId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get attendance by group' })
  findByGroup(@Param('groupId', ParseUUIDPipe) groupId: string, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.findByGroup(groupId, query);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get attendance by student' })
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.findByStudent(studentId, query);
  }

  @Get('group/:groupId/stats')
  @ApiOperation({ summary: 'Get attendance statistics for group' })
  getGroupStats(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.attendanceService.getGroupStats(groupId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.TEACHER)
  @ApiOperation({ summary: 'Update attendance record' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }
}
