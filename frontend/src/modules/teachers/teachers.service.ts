import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class TeachersService {
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
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, status: true } },
          _count: { select: { groups: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return { message: 'Teachers fetched', data: paginate(items, total, dto.page, dto.limit) };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, status: true } },
        groups: {
          include: { course: true, _count: { select: { members: true } } },
          where: { status: 'ACTIVE' },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return { message: 'Teacher fetched', data: teacher };
  }

  async create(dto: CreateTeacherDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const teacher = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'TEACHER',
        },
      });
      return tx.teacher.create({
        data: {
          userId: user.id,
          subjects: dto.subjects,
          salary: dto.salary,
          experience: dto.experience || 0,
          bio: dto.bio,
        },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
    });

    return { message: 'Teacher created', data: teacher };
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const { firstName, lastName, email, password, phone, ...profileData } = dto;

    await this.prisma.$transaction(async (tx) => {
      if (firstName || lastName || email || password || phone) {
        const userUpdate: any = {};
        if (firstName) userUpdate.firstName = firstName;
        if (lastName) userUpdate.lastName = lastName;
        if (email) userUpdate.email = email;
        if (phone) userUpdate.phone = phone;
        if (password) userUpdate.password = await bcrypt.hash(password, 12);
        await tx.user.update({ where: { id: teacher.userId }, data: userUpdate });
      }
      if (Object.keys(profileData).length > 0) {
        await tx.teacher.update({ where: { id }, data: profileData });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    await this.prisma.user.delete({ where: { id: teacher.userId } });
    return { message: 'Teacher deleted' };
  }
}
