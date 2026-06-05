import { Controller, Get, Param, Query, ParseUUIDPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportService } from './export.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private exportService: ExportService,
  ) {}

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

  // ─── Excel Eksport ───────────────────────────────────────────────────────────

  @Get('export/students')
  @ApiOperation({ summary: "O'quvchilar ro'yxatini Excel ga eksport qilish" })
  async exportStudents(@Res() res: Response) {
    const buf = await this.exportService.exportStudents();
    const filename = `oquvchilar_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  }

  @Get('export/payments')
  @ApiOperation({ summary: "To'lovlarni Excel ga eksport qilish" })
  async exportPayments(
    @Res() res: Response,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('groupId') groupId?: string,
  ) {
    const buf = await this.exportService.exportPayments(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
      groupId,
    );
    const filename = `tolovlar_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  }

  @Get('export/attendance/:groupId')
  @ApiOperation({ summary: 'Guruh davomatini Excel ga eksport qilish' })
  async exportAttendance(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Res() res: Response,
  ) {
    const buf = await this.exportService.exportAttendance(groupId);
    const filename = `davomat_${groupId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  }
}
