import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { take, skip } = getPaginationParams(dto.page, dto.limit);
    const where: any = {};
    if (dto.search) {
      where.user = {
        OR: [
          { firstName: { contains: dto.search, mode: 'insensitive' } },
          { lastName: { contains: dto.search, mode: 'insensitive' } },
          { email: { contains: dto.search, mode: 'insensitive' } },
          { phone: { contains: dto.search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, status: true },
          },
          groupMembers: {
            include: { group: { select: { id: true, name: true, status: true } } },
            where: { isActive: true },
          },
          _count: { select: { payments: true, attendance: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { message: 'Students fetched', data: paginate(items, total, dto.page, dto.limit) };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, status: true } },
        groupMembers: {
          include: { group: { include: { course: true, teacher: { include: { user: { select: { firstName: true, lastName: true } } } } } } },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        attendance: { orderBy: { date: 'desc' }, take: 10 },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return { message: 'Student fetched', data: student };
  }

  async create(dto: CreateStudentDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const student = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'STUDENT',
        },
      });
      return tx.student.create({
        data: {
          userId: user.id,
          parentPhone: dto.parentPhone,
          address: dto.address,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
          gender: dto.gender,
          notes: dto.notes,
        },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
      });
    });

    return { message: 'Student created', data: student };
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    const { firstName, lastName, email, password, phone, ...profileData } = dto;

    await this.prisma.$transaction(async (tx) => {
      if (firstName || lastName || email || password || phone) {
        const userUpdate: any = {};
        if (firstName) userUpdate.firstName = firstName;
        if (lastName) userUpdate.lastName = lastName;
        if (email) userUpdate.email = email;
        if (phone) userUpdate.phone = phone;
        if (password) userUpdate.password = await bcrypt.hash(password, 12);
        await tx.user.update({ where: { id: student.userId }, data: userUpdate });
      }
      await tx.student.update({
        where: { id },
        data: {
          ...profileData,
          birthDate: profileData.birthDate ? new Date(profileData.birthDate) : undefined,
        },
      });
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    await this.prisma.user.delete({ where: { id: student.userId } });
    return { message: 'Student deleted' };
  }

  async updatePhoto(studentId: string, filename: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const user = await this.prisma.user.update({
      where: { id: student.userId },
      data: { avatar: `/uploads/${filename}` },
      select: { id: true, avatar: true },
    });
    return { message: 'Photo updated', data: user };
  }
}
