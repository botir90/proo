import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async create(dto: { groupId: string; title: string; description?: string; dueDate?: string }, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const homework = await this.prisma.homework.create({
      data: {
        groupId: dto.groupId,
        teacherId: teacher.id,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        group: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
    });

    return { message: 'Vazifa yaratildi', data: homework };
  }

  async findByGroup(groupId: string) {
    const homeworks = await this.prisma.homework.findMany({
      where: { groupId },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { submissions: { where: { isDone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Vazifalar', data: homeworks };
  }

  async findMyHomeworks(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const groups = await this.prisma.groupMember.findMany({
      where: { studentId: student.id, isActive: true },
      select: { groupId: true },
    });
    const groupIds = groups.map(g => g.groupId);

    const homeworks = await this.prisma.homework.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        group: { select: { name: true, course: { select: { name: true, color: true } } } },
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        submissions: { where: { studentId: student.id }, select: { isDone: true, doneAt: true, note: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { message: 'Mening vazifalarim', data: homeworks };
  }

  async submitHomework(homeworkId: string, userId: string, note?: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const submission = await this.prisma.homeworkSubmission.upsert({
      where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
      update: { isDone: true, doneAt: new Date(), note },
      create: { homeworkId, studentId: student.id, isDone: true, doneAt: new Date(), note },
    });

    return { message: 'Vazifa bajarildi', data: submission };
  }

  async getSubmissions(homeworkId: string) {
    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Topshiriqlar', data: submissions };
  }

  async gradeSubmission(submissionId: string, points: number, teacherUserId: string) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: true },
    });
    if (!submission) throw new NotFoundException('Topshiriq topilmadi');

    const oldPoints = submission.points ?? 0;
    const diff = points - oldPoints;

    const [updated] = await this.prisma.$transaction([
      this.prisma.homeworkSubmission.update({
        where: { id: submissionId },
        data: { points, gradedAt: new Date() },
      }),
      this.prisma.student.update({
        where: { id: submission.studentId },
        data: { totalPoints: { increment: diff } },
      }),
    ]);

    return { message: 'Ball berildi', data: updated };
  }

  async delete(id: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    const homework = await this.prisma.homework.findUnique({ where: { id } });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');
    if (homework.teacherId !== teacher?.id) throw new ForbiddenException('Ruxsat yo\'q');
    await this.prisma.homework.delete({ where: { id } });
    return { message: 'Vazifa o\'chirildi' };
  }
}
