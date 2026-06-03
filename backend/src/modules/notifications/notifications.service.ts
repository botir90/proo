import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, dto: PaginationDto) {
    const { take, skip } = getPaginationParams(dto.page, dto.limit);
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { message: 'Notifications fetched', data: paginate(items, total, dto.page, dto.limit) };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { message: 'Unread count', data: { count } };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    const updated = await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    return { message: 'Marked as read', data: updated };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { message: 'All notifications marked as read' };
  }

  async create(userId: string, data: { title: string; message: string; type: NotificationType; senderId?: string; notificationData?: any }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        senderId: data.senderId,
        data: data.notificationData,
      },
    });
    return notification;
  }

  async sendBulk(userIds: string[], data: { title: string; message: string; type: NotificationType }) {
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, ...data })),
    });
    return { message: `Notification sent to ${userIds.length} users` };
  }

  async checkDebtAlerts(adminUserId?: string) {
    const overduePayments = await this.prisma.payment.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: new Date() } },
      include: { student: { include: { user: true } } },
    });

    let sentCount = 0;
    for (const payment of overduePayments) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: payment.student.userId,
          type: 'DEBT_ALERT',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!existing) {
        await this.create(payment.student.userId, {
          title: "To'lov muddati o'tdi",
          message: `${payment.month}/${payment.year} uchun ${Number(payment.debt).toLocaleString()} so'm qarzdorlik`,
          type: 'DEBT_ALERT',
          notificationData: { paymentId: payment.id, debt: payment.debt },
        });
        sentCount++;
      }
    }

    // Admin/Super Admin ga ham xulosa bildirishnoma yuborish
    if (adminUserId) {
      await this.create(adminUserId, {
        title: sentCount > 0 ? `${sentCount} ta qarz ogohlantirishlar yuborildi` : "Barcha to'lovlar amalga oshirilgan",
        message: sentCount > 0
          ? `${overduePayments.length} ta muddati o'tgan to'lov topildi, ${sentCount} ta o'quvchiga xabar yuborildi`
          : "Muddati o'tgan to'lovlar topilmadi",
        type: sentCount > 0 ? 'WARNING' : 'SUCCESS',
      });
    }

    return { message: `${overduePayments.length} ta to'lov tekshirildi, ${sentCount} ta xabar yuborildi`, data: { total: overduePayments.length, sent: sentCount } };
  }

  async remove(id: string, userId: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { message: 'Notification deleted' };
  }
}
