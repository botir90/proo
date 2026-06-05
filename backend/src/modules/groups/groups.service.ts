import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, AddStudentToGroupDto } from './dto/group.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, getPaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { take, skip } = getPaginationParams(dto.page, dto.limit);
    const where = dto.search
      ? { name: { contains: dto.search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take,
        include: {
          course: true,
          teacher: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count({ where }),
    ]);

    return { message: 'Groups fetched', data: paginate(items, total, dto.page, dto.limit) };
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        course: true,
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } } } },
        members: {
          include: {
            student: {
              include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, phone: true } } },
            },
          },
          where: { isActive: true },
        },
        _count: { select: { members: true, attendance: true } },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return { message: 'Group fetched', data: group };
  }

  async getTeacherGroups(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const groups = await this.prisma.group.findMany({
      where: { teacherId: teacher.id },
      include: {
        course: true,
        teacher: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
        _count: { select: { members: true, attendance: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { message: 'My groups', data: groups };
  }

  async create(dto: CreateGroupDto) {
    const [course, teacher] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
      this.prisma.teacher.findUnique({ where: { id: dto.teacherId } }),
    ]);
    if (!course) throw new NotFoundException('Course not found');
    if (!teacher) throw new NotFoundException('Teacher not found');

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        courseId: dto.courseId,
        teacherId: dto.teacherId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        schedule: dto.schedule,
        room: dto.room,
        maxStudents: dto.maxStudents || 20,
        status: dto.status || 'ACTIVE',
      },
      include: { course: true, teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });

    return { message: 'Group created', data: group };
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    const group = await this.prisma.group.update({ where: { id }, data, include: { course: true } });
    return { message: 'Group updated', data: group };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.group.delete({ where: { id } });
    return { message: 'Group deleted' };
  }

  async addStudent(groupId: string, dto: AddStudentToGroupDto) {
    const [group, student] = await Promise.all([
      this.prisma.group.findUnique({ where: { id: groupId }, include: { _count: { select: { members: { where: { isActive: true } } } } } }),
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
    ]);
    if (!group) throw new NotFoundException('Group not found');
    if (!student) throw new NotFoundException('Student not found');
    if (group.status !== 'ACTIVE') throw new BadRequestException('Group is not active');
    if (group._count.members >= group.maxStudents) throw new BadRequestException('Group is full');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_studentId: { groupId, studentId: dto.studentId } },
    });
    if (existing) {
      if (existing.isActive) throw new ConflictException('Student already in this group');
      const member = await this.prisma.groupMember.update({ where: { id: existing.id }, data: { isActive: true, joinDate: new Date() } });
      return { message: 'Student added back to group', data: member };
    }

    const member = await this.prisma.groupMember.create({ data: { groupId, studentId: dto.studentId } });
    return { message: 'Student added to group', data: member };
  }

  async removeStudent(groupId: string, studentId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_studentId: { groupId, studentId } },
    });
    if (!member) throw new NotFoundException('Student not in this group');
    await this.prisma.groupMember.update({ where: { id: member.id }, data: { isActive: false } });
    return { message: 'Student removed from group' };
  }

  async getGroupStudents(groupId: string) {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId, isActive: true },
      include: {
        student: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, phone: true, email: true } } },
        },
      },
    });
    return { message: 'Group students fetched', data: members };
  }
}
