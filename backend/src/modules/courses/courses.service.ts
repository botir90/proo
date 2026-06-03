import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { take, skip } = getPaginationParams(dto.page, dto.limit);
    const where = dto.search
      ? { OR: [{ name: { contains: dto.search, mode: 'insensitive' as const } }, { description: { contains: dto.search, mode: 'insensitive' as const } }] }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        include: { _count: { select: { groups: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { message: 'Courses fetched', data: paginate(items, total, dto.page, dto.limit) };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
            _count: { select: { members: true } },
          },
        },
        _count: { select: { groups: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return { message: 'Course fetched', data: course };
  }

  async create(dto: CreateCourseDto) {
    const existing = await this.prisma.course.findFirst({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Course with this name already exists');
    const course = await this.prisma.course.create({ data: dto });
    return { message: 'Course created', data: course };
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);
    const course = await this.prisma.course.update({ where: { id }, data: dto });
    return { message: 'Course updated', data: course };
  }

  async remove(id: string) {
    await this.findOne(id);
    const activeGroups = await this.prisma.group.count({ where: { courseId: id, status: 'ACTIVE' } });
    if (activeGroups > 0) throw new ConflictException('Cannot delete course with active groups');
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted' };
  }
}
