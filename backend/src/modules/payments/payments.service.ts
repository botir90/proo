import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto, PaymentQueryDto, StudentPayDto } from './dto/payment.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaymentQueryDto) {
    const { take, skip } = getPaginationParams(query.page, query.limit);
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.groupId) where.groupId = query.groupId;
    if (query.status) where.status = query.status;
    if (query.month) where.month = query.month;
    if (query.year) where.year = query.year;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          group: { include: { course: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { message: 'Payments fetched', data: paginate(items, total, query.page, query.limit) };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } } },
        group: { include: { course: true, teacher: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { message: 'Payment fetched', data: payment };
  }

  async create(dto: CreatePaymentDto) {
    const [student, group] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
      this.prisma.group.findUnique({ where: { id: dto.groupId }, include: { course: true } }),
    ]);
    if (!student) throw new NotFoundException('Student not found');
    if (!group) throw new NotFoundException('Group not found');

    const paidAmount = dto.paidAmount || 0;
    const debt = Number(dto.amount) - paidAmount;
    let status: any = 'PENDING';
    if (paidAmount >= Number(dto.amount)) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIAL';
    else if (new Date(dto.dueDate) < new Date()) status = 'OVERDUE';

    const payment = await this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        groupId: dto.groupId,
        amount: dto.amount,
        paidAmount,
        debt,
        dueDate: new Date(dto.dueDate),
        paidDate: paidAmount > 0 ? new Date() : null,
        status,
        method: dto.method || 'CASH',
        description: dto.description,
        month: dto.month,
        year: dto.year,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        group: { include: { course: { select: { name: true } } } },
      },
    });

    return { message: 'Payment created', data: payment };
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    const data: any = { ...dto };
    if (dto.paidDate) data.paidDate = new Date(dto.paidDate);

    if (dto.paidAmount !== undefined) {
      const newDebt = Number(payment.amount) - dto.paidAmount;
      data.debt = newDebt < 0 ? 0 : newDebt;
      if (dto.paidAmount >= Number(payment.amount)) data.status = 'PAID';
      else if (dto.paidAmount > 0) data.status = 'PARTIAL';
      if (dto.paidAmount > 0 && !dto.paidDate) data.paidDate = new Date();
    }

    const updated = await this.prisma.payment.update({ where: { id }, data });
    return { message: 'Payment updated', data: updated };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment deleted' };
  }

  async getStudentDebt(studentId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { studentId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      include: { group: { include: { course: { select: { name: true } } } } },
    });

    const totalDebt = payments.reduce((sum, p) => sum + Number(p.debt), 0);
    return { message: 'Student debt fetched', data: { payments, totalDebt } };
  }

  async getMonthlyRevenue(year: number) {
    const payments = await this.prisma.payment.findMany({
      where: { year, status: { in: ['PAID', 'PARTIAL'] } },
      select: { month: true, paidAmount: true },
    });

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: payments
        .filter((p) => p.month === i + 1)
        .reduce((sum, p) => sum + Number(p.paidAmount), 0),
    }));

    const totalRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
    return { message: 'Monthly revenue', data: { monthly, totalRevenue, year } };
  }

  async getMyPayments(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profil topilmadi');

    const payments = await this.prisma.payment.findMany({
      where: { studentId: student.id },
      include: {
        group: {
          include: { course: { select: { name: true, color: true } } },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const totalDebt = payments.reduce((sum, p) => sum + Number(p.debt), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const pendingCount = payments.filter((p) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(p.status)).length;

    return { message: 'My payments', data: { payments, totalDebt, totalPaid, pendingCount } };
  }

  async payByStudent(paymentId: string, userId: string, dto: StudentPayDto) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profil topilmadi');

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    if (payment.studentId !== student.id) throw new ForbiddenException('Ruxsat yo\'q');
    if (payment.status === 'PAID') throw new BadRequestException('Bu to\'lov allaqachon to\'langan');

    const newPaidAmount = Number(payment.paidAmount) + dto.amount;
    const newDebt = Math.max(0, Number(payment.amount) - newPaidAmount);
    const newStatus: any = newPaidAmount >= Number(payment.amount) ? 'PAID' : 'PARTIAL';

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        paidAmount: newPaidAmount,
        debt: newDebt,
        status: newStatus,
        method: dto.method ?? 'ONLINE',
        paidDate: new Date(),
        description: dto.description,
      },
      include: {
        group: { include: { course: { select: { name: true } } } },
      },
    });

    return { message: "To'lov muvaffaqiyatli amalga oshirildi", data: updated };
  }

  async generateMonthlyInvoices(groupId: string, month: number, year: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { course: true, members: { where: { isActive: true } } },
    });
    if (!group) throw new NotFoundException('Group not found');

    const existing = await this.prisma.payment.count({
      where: { groupId, month, year },
    });
    if (existing > 0) throw new BadRequestException('Invoices already generated for this month');

    const dueDate = new Date(year, month, 5);
    const payments = await this.prisma.payment.createMany({
      data: group.members.map((m) => ({
        studentId: m.studentId,
        groupId,
        amount: group.course.price,
        paidAmount: 0,
        debt: Number(group.course.price),
        dueDate,
        status: 'PENDING' as const,
        method: 'CASH' as const,
        month,
        year,
      })),
    });

    return { message: `${payments.count} invoices generated`, data: payments };
  }
}
