import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto, AttendanceQueryDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Admin/Manager uchun: teacherProfileId yo'q bo'lsa, guruh o'qituvchisini oladi
  async createAttendance(dto: CreateAttendanceDto, teacherProfileId: string | undefined, groupId: string) {
    let teacherId = teacherProfileId;
    if (!teacherId) {
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        select: { teacherId: true },
      });
      if (!group) throw new NotFoundException('Group not found');
      teacherId = group.teacherId;
    }
    return this.create(dto, teacherId);
  }

  async create(dto: CreateAttendanceDto, teacherId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
      include: { members: { where: { isActive: true } } },
    });
    if (!group) throw new NotFoundException('Group not found');

    const date = new Date(dto.date);
    const existingCount = await this.prisma.attendance.count({
      where: { groupId: dto.groupId, date },
    });
    if (existingCount > 0) throw new BadRequestException('Attendance already taken for this date');

    const records = await this.prisma.attendance.createMany({
      data: dto.records.map((r) => ({
        groupId: dto.groupId,
        studentId: r.studentId,
        teacherId,
        date,
        status: r.status,
        note: r.note,
      })),
    });

    return { message: `Attendance recorded for ${records.count} students`, data: records };
  }

  async findByGroup(groupId: string, query: AttendanceQueryDto) {
    const where: any = { groupId };
    if (query.startDate) where.date = { gte: new Date(query.startDate) };
    if (query.endDate) where.date = { ...where.date, lte: new Date(query.endDate) };

    const attendance = await this.prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    return { message: 'Attendance fetched', data: attendance };
  }

  async findByStudent(studentId: string, query: AttendanceQueryDto) {
    const where: any = { studentId };
    if (query.groupId) where.groupId = query.groupId;
    if (query.startDate) where.date = { gte: new Date(query.startDate) };
    if (query.endDate) where.date = { ...where.date, lte: new Date(query.endDate) };

    const attendance = await this.prisma.attendance.findMany({
      where,
      include: { group: { include: { course: true } } },
      orderBy: { date: 'desc' },
    });

    const stats = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === 'PRESENT').length,
      absent: attendance.filter((a) => a.status === 'ABSENT').length,
      late: attendance.filter((a) => a.status === 'LATE').length,
      excused: attendance.filter((a) => a.status === 'EXCUSED').length,
    };

    return { message: 'Student attendance fetched', data: { attendance, stats } };
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    const updated = await this.prisma.attendance.update({ where: { id }, data: dto });
    return { message: 'Attendance updated', data: updated };
  }

  async getGroupStats(groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const stats = await this.prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: { groupId },
      _count: { status: true },
    });

    const studentStats = await this.prisma.student.findMany({
      where: { groupMembers: { some: { groupId, isActive: true } } },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
        attendance: { where: { groupId }, select: { status: true } },
      },
    });

    const result = studentStats.map((s) => ({
      student: s,
      stats: {
        total: s.attendance.length,
        present: s.attendance.filter((a) => a.status === 'PRESENT').length,
        absent: s.attendance.filter((a) => a.status === 'ABSENT').length,
        late: s.attendance.filter((a) => a.status === 'LATE').length,
        rate: s.attendance.length
          ? Math.round((s.attendance.filter((a) => a.status === 'PRESENT').length / s.attendance.length) * 100)
          : 0,
      },
    }));

    return { message: 'Group attendance stats', data: result };
  }
}
