import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getStudentReport(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        groupMembers: {
          include: {
            group: { include: { course: { select: { name: true } } } },
          },
        },
        payments: { orderBy: { createdAt: 'desc' } },
        attendance: { orderBy: { date: 'desc' } },
      },
    });

    const totalPaid = student.payments.reduce((s, p) => s + Number(p.paidAmount), 0);
    const totalDebt = student.payments.reduce((s, p) => s + Number(p.debt), 0);
    const attendanceRate = student.attendance.length
      ? Math.round((student.attendance.filter((a) => a.status === 'PRESENT').length / student.attendance.length) * 100)
      : 0;

    return {
      message: 'Student report',
      data: { student, summary: { totalPaid, totalDebt, attendanceRate, totalClasses: student.attendance.length } },
    };
  }

  async getTeacherReport(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        groups: {
          include: {
            course: true,
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
        attendance: { select: { status: true } },
      },
    });

    const totalStudents = teacher.groups.reduce((s, g) => s + g._count.members, 0);
    const activeGroups = teacher.groups.filter((g) => g.status === 'ACTIVE').length;

    return {
      message: 'Teacher report',
      data: { teacher, summary: { totalStudents, activeGroups, totalGroups: teacher.groups.length } },
    };
  }

  async getPaymentReport(query: { month?: number; year?: number; groupId?: string }) {
    const where: any = {};
    if (query.month) where.month = query.month;
    if (query.year) where.year = query.year;
    if (query.groupId) where.groupId = query.groupId;

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        group: { include: { course: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total: payments.length,
      paid: payments.filter((p) => p.status === 'PAID').length,
      pending: payments.filter((p) => p.status === 'PENDING').length,
      partial: payments.filter((p) => p.status === 'PARTIAL').length,
      overdue: payments.filter((p) => p.status === 'OVERDUE').length,
      totalAmount: payments.reduce((s, p) => s + Number(p.amount), 0),
      totalPaid: payments.reduce((s, p) => s + Number(p.paidAmount), 0),
      totalDebt: payments.reduce((s, p) => s + Number(p.debt), 0),
    };

    return { message: 'Payment report', data: { payments, summary } };
  }

  async getAttendanceReport(query: { groupId?: string; month?: number; year?: number }) {
    const where: any = {};
    if (query.groupId) where.groupId = query.groupId;
    if (query.month && query.year) {
      const start = new Date(query.year, query.month - 1, 1);
      const end = new Date(query.year, query.month, 0);
      where.date = { gte: start, lte: end };
    }

    const attendance = await this.prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        group: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const summary = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === 'PRESENT').length,
      absent: attendance.filter((a) => a.status === 'ABSENT').length,
      late: attendance.filter((a) => a.status === 'LATE').length,
      excused: attendance.filter((a) => a.status === 'EXCUSED').length,
      rate: attendance.length
        ? Math.round((attendance.filter((a) => a.status === 'PRESENT').length / attendance.length) * 100)
        : 0,
    };

    return { message: 'Attendance report', data: { attendance, summary } };
  }
}
