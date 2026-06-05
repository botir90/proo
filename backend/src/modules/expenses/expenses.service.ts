import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { month?: number; year?: number; category?: string }) {
    const where: any = {};
    if (params?.category) where.category = params.category;
    if (params?.month && params?.year) {
      const start = new Date(params.year, params.month - 1, 1);
      const end = new Date(params.year, params.month, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    } else if (params?.year) {
      const start = new Date(params.year, 0, 1);
      const end = new Date(params.year, 11, 31, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({ where, orderBy: { date: 'desc' } }),
      this.prisma.expense.count({ where }),
    ]);

    const totalAmount = items.reduce((s, e) => s + Number(e.amount), 0);
    const byCategory = items.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    return { message: 'Expenses fetched', data: { items, total, totalAmount, byCategory } };
  }

  async create(dto: { title: string; amount: number; category: string; description?: string; date?: string }) {
    const expense = await this.prisma.expense.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        category: dto.category,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
    return { message: 'Xarajat qo\'shildi', data: expense };
  }

  async remove(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Topilmadi');
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'O\'chirildi' };
  }
}
