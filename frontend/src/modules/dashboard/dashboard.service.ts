import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalStudents, totalTeachers, totalCourses, totalGroups,
      activeGroups, prevMonthStudents, prevMonthTeachers,
      monthlyRevenue, lastMonthRevenue,
      recentStudents, overduePayments,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.course.count({ where: { isActive: true } }),
      this.prisma.group.count(),
      this.prisma.group.count({ where: { status: 'ACTIVE' } }),
      this.prisma.student.count({ where: { createdAt: { lt: startOfMonth } } }),
      this.prisma.teacher.count({ where: { createdAt: { lt: startOfMonth } } }),
      this.prisma.payment.aggregate({
        where: { month: now.getMonth() + 1, year: now.getFullYear(), status: { in: ['PAID', 'PARTIAL'] } },
        _sum: { paidAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { month: startOfLastMonth.getMonth() + 1, year: startOfLastMonth.getFullYear(), status: { in: ['PAID', 'PARTIAL'] } },
        _sum: { paidAmount: true },
      }),
      this.prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, avatar: true, email: true } } },
      }),
      this.prisma.payment.findMany({
        where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: now } },
        include: { student: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } },
        take: 10,
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const currentRevenue = Number(monthlyRevenue._sum.paidAmount || 0);
    const previousRevenue = Number(lastMonthRevenue._sum.paidAmount || 0);
    const revenueGrowth = previousRevenue
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 100;

    return {
      message: 'Dashboard stats',
      data: {
        stats: {
          totalStudents: { value: totalStudents, growth: totalStudents - prevMonthStudents },
          totalTeachers: { value: totalTeachers, growth: totalTeachers - prevMonthTeachers },
          totalCourses: { value: totalCourses },
          activeGroups: { value: activeGroups, total: totalGroups },
          monthlyRevenue: { value: currentRevenue, growth: revenueGrowth },
        },
        recentStudents,
        overduePayments,
      },
    };
  }

  async getRevenueChart(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const payments = await this.prisma.payment.findMany({
      where: { year: targetYear, status: { in: ['PAID', 'PARTIAL'] } },
      select: { month: true, paidAmount: true },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: months[i],
      revenue: payments.filter((p) => p.month === i + 1).reduce((sum, p) => sum + Number(p.paidAmount), 0),
    }));

    return { message: 'Revenue chart data', data: { chart: data, year: targetYear } };
  }

  async getGroupsOverview() {
    const groups = await this.prisma.group.findMany({
      where: { status: 'ACTIVE' },
      include: {
        course: { select: { name: true, color: true } },
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { members: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { message: 'Groups overview', data: groups };
  }
}
