import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    groupId: string; title: string; description?: string;
    timeLimit?: number; questions: { question: string; options: string[]; answer: number; order?: number }[];
  }, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const quiz = await this.prisma.quiz.create({
      data: {
        groupId: dto.groupId,
        teacherId: teacher.id,
        title: dto.title,
        description: dto.description,
        timeLimit: dto.timeLimit,
        questions: {
          create: dto.questions.map((q, i) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            order: q.order ?? i,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } }, _count: { select: { attempts: true } } },
    });

    return { message: 'Test yaratildi', data: quiz };
  }

  async findByGroup(groupId: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { groupId },
      include: {
        _count: { select: { questions: true, attempts: true } },
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Testlar', data: quizzes };
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException('Test topilmadi');

    // Student uchun to'g'ri javoblarni yashiramiz
    return {
      message: 'Test', data: {
        ...quiz,
        questions: quiz.questions.map(q => ({ ...q, answer: undefined })),
      },
    };
  }

  async findMyQuizzes(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const groups = await this.prisma.groupMember.findMany({
      where: { studentId: student.id, isActive: true },
      select: { groupId: true },
    });
    const groupIds = groups.map(g => g.groupId);

    const quizzes = await this.prisma.quiz.findMany({
      where: { groupId: { in: groupIds }, isActive: true },
      include: {
        _count: { select: { questions: true } },
        group: { select: { name: true, course: { select: { name: true, color: true } } } },
        attempts: { where: { studentId: student.id }, select: { score: true, total: true, finishedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { message: 'Mening testlarim', data: quizzes };
  }

  async submitAttempt(quizId: string, userId: string, answers: Record<string, number>) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const existing = await this.prisma.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId: student.id } },
    });
    if (existing?.finishedAt) throw new BadRequestException('Test allaqachon topshirilgan');

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Test topilmadi');
    if (!quiz.isActive) throw new BadRequestException('Test hali faol emas');

    // Natijani hisoblash
    let score = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.answer) score++;
    });

    const attempt = await this.prisma.quizAttempt.upsert({
      where: { quizId_studentId: { quizId, studentId: student.id } },
      update: { answers, score, total: quiz.questions.length, finishedAt: new Date() },
      create: { quizId, studentId: student.id, answers, score, total: quiz.questions.length, finishedAt: new Date() },
    });

    return {
      message: 'Test topshirildi',
      data: { score, total: quiz.questions.length, percent: Math.round((score / quiz.questions.length) * 100), attempt },
    };
  }

  async toggleActive(id: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Test topilmadi');
    if (quiz.teacherId !== teacher?.id) throw new ForbiddenException('Ruxsat yo\'q');

    const updated = await this.prisma.quiz.update({ where: { id }, data: { isActive: !quiz.isActive } });
    return { message: updated.isActive ? 'Test faollashtirildi' : 'Test to\'xtatildi', data: updated };
  }

  async delete(id: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Test topilmadi');
    if (quiz.teacherId !== teacher?.id) throw new ForbiddenException('Ruxsat yo\'q');
    await this.prisma.quiz.delete({ where: { id } });
    return { message: 'Test o\'chirildi' };
  }

  async getResults(quizId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, finishedAt: { not: null } },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { score: 'desc' },
    });
    return { message: 'Natijalar', data: attempts };
  }
}
