import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LessonReminderService {
  private readonly logger = new Logger(LessonReminderService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendLessonReminders() {
    const now = new Date();
    const in15 = new Date(now.getTime() + 16 * 60 * 1000);
    const in14 = new Date(now.getTime() + 14 * 60 * 1000);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        lessonDate: { gte: in14, lte: in15 },
        status: 'PLANNED',
        reminderSent: false,
      },
      include: {
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        group: {
          include: {
            members: {
              where: { isActive: true },
              include: { student: { include: { user: { select: { id: true } } } } },
            },
          },
        },
      },
    });

    for (const lesson of lessons) {
      const time = lesson.lessonDate.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });

      await this.notificationsService.create(lesson.teacher.user.id, {
        title: "Dars boshlanishiga 15 daqiqa qoldi",
        message: `"${lesson.title}" darsi soat ${time}da ${lesson.group.name} guruhida boshlanadi`,
        type: 'INFO',
      });

      const studentIds = lesson.group.members.map((m) => m.student.user.id);
      if (studentIds.length > 0) {
        await this.notificationsService.sendBulk(studentIds, {
          title: "Dars boshlanishiga 15 daqiqa qoldi",
          message: `"${lesson.title}" darsi soat ${time}da boshlanadi`,
          type: 'INFO',
        });
      }

      await this.prisma.lesson.update({
        where: { id: lesson.id },
        data: { reminderSent: true },
      });

      this.logger.log(`Reminder sent for lesson "${lesson.title}" to ${1 + studentIds.length} users`);
    }
  }
}
