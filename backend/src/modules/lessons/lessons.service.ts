import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';

const LESSON_INCLUDE = {
  group: {
    select: {
      name: true,
      course: { select: { name: true, color: true } },
    },
  },
  teacher: {
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  },
} as const;

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLessonDto, userId: string, userRole: string) {
    let teacherId: string;

    if (ADMIN_ROLES.includes(userRole)) {
      // Admin: use the group's assigned teacher
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
        select: { teacherId: true },
      });
      if (!group) throw new NotFoundException('Guruh topilmadi');
      teacherId = group.teacherId;
    } else {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
      teacherId = teacher.id;
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        groupId:     dto.groupId,
        teacherId,
        title:       dto.title,
        description: dto.description,
        lessonDate:  new Date(dto.lessonDate),
        duration:    dto.duration ?? 60,
        topic:       dto.topic,
      },
      include: LESSON_INCLUDE,
    });

    return { message: 'Dars yaratildi', data: lesson };
  }

  async findAllLessons() {
    const lessons = await this.prisma.lesson.findMany({
      include: LESSON_INCLUDE,
      orderBy: { lessonDate: 'desc' },
    });
    return { message: 'Barcha darslar', data: lessons };
  }

  async findMyLessons(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const lessons = await this.prisma.lesson.findMany({
      where: { teacherId: teacher.id },
      include: LESSON_INCLUDE,
      orderBy: { lessonDate: 'desc' },
    });

    return { message: 'Mening darslarim', data: lessons };
  }

  async findStudentLessons(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const members = await this.prisma.groupMember.findMany({
      where: { studentId: student.id, isActive: true },
      select: { groupId: true },
    });
    const groupIds = members.map(m => m.groupId);

    const lessons = await this.prisma.lesson.findMany({
      where: { groupId: { in: groupIds }, status: { not: 'CANCELLED' } },
      include: LESSON_INCLUDE,
      orderBy: { lessonDate: 'asc' },
    });

    return { message: 'Mening darslarim', data: lessons };
  }

  async findByGroup(groupId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { groupId },
      include: LESSON_INCLUDE,
      orderBy: { lessonDate: 'desc' },
    });
    return { message: 'Guruh darslari', data: lessons };
  }

  async update(id: string, dto: UpdateLessonDto, userId: string, userRole: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    if (!ADMIN_ROLES.includes(userRole)) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
      if (lesson.teacherId !== teacher?.id) throw new ForbiddenException("Ruxsat yo'q");
    }

    const data: any = { ...dto };
    if (dto.lessonDate) data.lessonDate = new Date(dto.lessonDate);

    const updated = await this.prisma.lesson.update({ where: { id }, data, include: LESSON_INCLUDE });
    return { message: 'Dars yangilandi', data: updated };
  }

  async remove(id: string, userId: string, userRole: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    if (!ADMIN_ROLES.includes(userRole)) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
      if (lesson.teacherId !== teacher?.id) throw new ForbiddenException("Ruxsat yo'q");
    }

    await this.prisma.lesson.delete({ where: { id } });
    return { message: "Dars o'chirildi" };
  }

  async checkAttendance(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const dayStart = new Date(lesson.lessonDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(lesson.lessonDate);
    dayEnd.setHours(23, 59, 59, 999);

    const count = await this.prisma.attendance.count({
      where: { groupId: lesson.groupId, date: { gte: dayStart, lte: dayEnd } },
    });

    return { message: 'Attendance status', data: { taken: count > 0, groupId: lesson.groupId, lessonDate: lesson.lessonDate } };
  }
}
