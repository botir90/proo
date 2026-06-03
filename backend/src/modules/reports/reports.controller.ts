import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('student/:id')
  @ApiOperation({ summary: 'Get student report' })
  getStudentReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getStudentReport(id);
  }

  @Get('teacher/:id')
  @ApiOperation({ summary: 'Get teacher report' })
  getTeacherReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getTeacherReport(id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment report' })
  getPaymentReport(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.reportsService.getPaymentReport({
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      groupId,
    });
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance report' })
  getAttendanceReport(
    @Query('groupId') groupId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getAttendanceReport({
      groupId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
    });
  }
}
