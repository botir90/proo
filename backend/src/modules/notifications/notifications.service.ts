import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

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

  async checkDebtAlerts(adminUserId?: string, withSms = false) {
    const overduePayments = await this.prisma.payment.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: new Date() } },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
        group: { include: { course: { select: { name: true } } } },
      },
    });

    let sentCount = 0;
    let smsSent = 0;

    for (const payment of overduePayments) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await this.prisma.notification.findFirst({
        where: { userId: payment.student.userId, type: 'DEBT_ALERT', createdAt: { gte: oneDayAgo } },
      });

      if (!existing) {
        const debt = Number(payment.debt).toLocaleString('uz-UZ');
        await this.create(payment.student.userId, {
          title: "To'lov muddati o'tdi",
          message: `${payment.group?.course?.name} — ${payment.month}/${payment.year} uchun ${debt} so'm qarzdorlik`,
          type: 'DEBT_ALERT',
          notificationData: { paymentId: payment.id, debt: payment.debt },
        });
        sentCount++;

        // Ixtiyoriy SMS yuborish
        if (withSms && payment.student.user.phone) {
          const smsText =
            `EduCRM: Hurmatli ${payment.student.user.firstName}, ` +
            `${payment.group?.course?.name} kursi uchun ${debt} so'm ` +
            `to'lovingiz muddati o'tgan. Iltimos to'lang.`;
          const ok = await this.smsService.send(payment.student.user.phone, smsText);
          if (ok) smsSent++;
        }
      }
    }

    if (adminUserId) {
      await this.create(adminUserId, {
        title: sentCount > 0 ? `${sentCount} ta qarz ogohlantirishlar yuborildi` : "Barcha to'lovlar amalga oshirilgan",
        message: sentCount > 0
          ? `${overduePayments.length} ta muddati o'tgan to'lov, ${sentCount} ta in-app` +
            (withSms ? `, ${smsSent} ta SMS yuborildi` : '')
          : "Muddati o'tgan to'lovlar topilmadi",
        type: sentCount > 0 ? 'WARNING' : 'SUCCESS',
      });
    }

    return {
      message: `${overduePayments.length} ta to'lov tekshirildi`,
      data: { total: overduePayments.length, notificationsSent: sentCount, smsSent },
    };
  }

  async sendSmsToGroup(groupId: string, message: string) {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId, isActive: true },
      include: { student: { include: { user: { select: { phone: true } } } } },
    });
    const phones = members
      .map(m => m.student.user.phone)
      .filter((p): p is string => !!p);

    const result = await this.smsService.sendBulk(phones, message);
    return { message: `SMS yuborildi`, data: result };
  }

  async remove(id: string, userId: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { message: 'Notification deleted' };
  }
}
