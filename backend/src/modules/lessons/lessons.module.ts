import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonReminderService } from './lesson-reminder.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonReminderService],
  exports: [LessonsService],
})
export class LessonsModule {}
