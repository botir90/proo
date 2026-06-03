import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { take, skip } = getPaginationParams(dto.page, dto.limit);
    const where = dto.search
      ? {
          OR: [
            { firstName: { contains: dto.search, mode: 'insensitive' as const } },
            { lastName: { contains: dto.search, mode: 'insensitive' as const } },
            { email: { contains: dto.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, avatar: true, role: true, status: true,
          lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { message: 'Users fetched', data: paginate(items, total, dto.page, dto.limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, role: true, status: true,
        lastLoginAt: true, createdAt: true,
        teacherProfile: true,
        studentProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User fetched', data: user };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, status: true, createdAt: true,
      },
    });
    return { message: 'User created', data: user };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, status: true, updatedAt: true,
      },
    });
    return { message: 'User updated', data: user };
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) throw new ForbiddenException('Cannot delete yourself');
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }

  async updateAvatar(userId: string, filename: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: `/uploads/${filename}` },
      select: { id: true, avatar: true },
    });
    return { message: 'Avatar updated', data: user };
  }
}
