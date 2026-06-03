import { PrismaClient, Role, UserStatus, GroupStatus, Gender } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pwd: string) => bcrypt.hash(pwd, 12);

  // === SUPER ADMIN ===
  await prisma.user.create({
    data: {
      email: 'superadmin@educrm.pro',
      password: await hash('Admin@123'),
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+998901111111',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // === ADMIN ===
  await prisma.user.create({
    data: {
      email: 'admin@educrm.pro',
      password: await hash('Admin@123'),
      firstName: 'Aziz',
      lastName: 'Karimov',
      phone: '+998902222222',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // === MANAGER ===
  await prisma.user.create({
    data: {
      email: 'manager@educrm.pro',
      password: await hash('Manager@123'),
      firstName: 'Malika',
      lastName: 'Yusupova',
      phone: '+998903333333',
      role: Role.MANAGER,
      status: UserStatus.ACTIVE,
    },
  });

  // === COURSES ===
  const courses = await Promise.all([
    prisma.course.create({ data: { name: 'English A1', description: 'Beginner English course', price: 800000, duration: 3, color: '#6366f1' } }),
    prisma.course.create({ data: { name: 'English B1', description: 'Intermediate English course', price: 900000, duration: 4, color: '#8b5cf6' } }),
    prisma.course.create({ data: { name: 'Math', description: 'Mathematics course', price: 700000, duration: 3, color: '#06b6d4' } }),
    prisma.course.create({ data: { name: 'IT Basics', description: 'Introduction to programming', price: 1200000, duration: 6, color: '#10b981' } }),
    prisma.course.create({ data: { name: 'Russian A1', description: 'Beginner Russian', price: 750000, duration: 3, color: '#f59e0b' } }),
  ]);

  // === TEACHERS ===
  const teacherData = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@educrm.pro', phone: '+998911234567', subjects: ['English', 'IELTS'], salary: 5000000, experience: 8, bio: 'IELTS 8.5 - 8 years experience' },
    { firstName: 'Nodira', lastName: 'Rashidova', email: 'nodira.rashidova@educrm.pro', phone: '+998912345678', subjects: ['English', 'Business English'], salary: 4500000, experience: 5 },
    { firstName: 'Anvar', lastName: 'Toshmatov', email: 'anvar.toshmatov@educrm.pro', phone: '+998913456789', subjects: ['Math', 'Physics'], salary: 4000000, experience: 10 },
    { firstName: 'Dilorom', lastName: 'Mirzayeva', email: 'dilorom@educrm.pro', phone: '+998914567890', subjects: ['Python', 'JavaScript', 'React'], salary: 6000000, experience: 6 },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const user = await prisma.user.create({
      data: { email: t.email, password: await hash('Teacher@123'), firstName: t.firstName, lastName: t.lastName, phone: t.phone, role: Role.TEACHER },
    });
    const teacher = await prisma.teacher.create({
      data: { userId: user.id, subjects: t.subjects, salary: t.salary, experience: t.experience, bio: t.bio },
    });
    teachers.push(teacher);
  }

  // === GROUPS ===
  const groups = await Promise.all([
    prisma.group.create({ data: { name: 'English A1 - Group 1', courseId: courses[0].id, teacherId: teachers[0].id, startDate: new Date('2024-01-15'), schedule: 'Mon, Wed, Fri 14:00-16:00', room: 'Room 101', maxStudents: 15, status: GroupStatus.ACTIVE } }),
    prisma.group.create({ data: { name: 'English A1 - Group 2', courseId: courses[0].id, teacherId: teachers[1].id, startDate: new Date('2024-02-01'), schedule: 'Tue, Thu, Sat 10:00-12:00', room: 'Room 102', maxStudents: 12, status: GroupStatus.ACTIVE } }),
    prisma.group.create({ data: { name: 'Math - Group 1', courseId: courses[2].id, teacherId: teachers[2].id, startDate: new Date('2024-01-20'), schedule: 'Mon, Wed 16:00-18:00', room: 'Room 201', maxStudents: 20, status: GroupStatus.ACTIVE } }),
    prisma.group.create({ data: { name: 'IT Basics - Group 1', courseId: courses[3].id, teacherId: teachers[3].id, startDate: new Date('2024-02-10'), schedule: 'Tue, Thu, Sat 14:00-17:00', room: 'Lab 301', maxStudents: 10, status: GroupStatus.ACTIVE } }),
  ]);

  // === STUDENTS ===
  const studentData = [
    { firstName: 'Bobur', lastName: 'Aliyev', email: 'bobur@student.com', phone: '+998911111111', parentPhone: '+998901111110', address: 'Tashkent, Chilonzor', birthDate: new Date('2005-03-15'), gender: Gender.MALE },
    { firstName: 'Zulfiya', lastName: 'Nazarova', email: 'zulfiya@student.com', phone: '+998911111112', parentPhone: '+998901111113', address: 'Tashkent, Yunusobod', birthDate: new Date('2006-07-22'), gender: Gender.FEMALE },
    { firstName: 'Jasur', lastName: 'Umarov', email: 'jasur@student.com', phone: '+998911111114', parentPhone: '+998901111115', address: 'Tashkent, Mirzo Ulugbek', birthDate: new Date('2005-11-08'), gender: Gender.MALE },
    { firstName: 'Nilufar', lastName: 'Xolmatova', email: 'nilufar@student.com', phone: '+998911111116', parentPhone: '+998901111117', address: 'Tashkent, Shayxontohur', birthDate: new Date('2007-01-30'), gender: Gender.FEMALE },
    { firstName: 'Sardor', lastName: 'Bekmurodov', email: 'sardor@student.com', phone: '+998911111118', parentPhone: '+998901111119', address: 'Tashkent, Olmazor', birthDate: new Date('2006-05-12'), gender: Gender.MALE },
    { firstName: 'Hulkar', lastName: 'Qodirov', email: 'hulkar@student.com', phone: '+998911111120', parentPhone: '+998901111121', address: 'Tashkent, Yashnobod', birthDate: new Date('2005-09-25'), gender: Gender.FEMALE },
  ];

  const students = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: { email: s.email, password: await hash('Student@123'), firstName: s.firstName, lastName: s.lastName, phone: s.phone, role: Role.STUDENT },
    });
    const student = await prisma.student.create({
      data: { userId: user.id, parentPhone: s.parentPhone, address: s.address, birthDate: s.birthDate, gender: s.gender },
    });
    students.push(student);
  }

  // === GROUP MEMBERS ===
  // Group 1: students 0,1,2,3
  await prisma.groupMember.createMany({
    data: [
      { groupId: groups[0].id, studentId: students[0].id },
      { groupId: groups[0].id, studentId: students[1].id },
      { groupId: groups[0].id, studentId: students[2].id },
    ],
  });
  // Group 3: students 3,4,5
  await prisma.groupMember.createMany({
    data: [
      { groupId: groups[2].id, studentId: students[3].id },
      { groupId: groups[2].id, studentId: students[4].id },
      { groupId: groups[2].id, studentId: students[5].id },
    ],
  });
  // Group 4: students 0,4
  await prisma.groupMember.createMany({
    data: [
      { groupId: groups[3].id, studentId: students[0].id },
      { groupId: groups[3].id, studentId: students[4].id },
    ],
  });

  // === PAYMENTS ===
  const now = new Date();
  const paymentData = [];
  for (const student of students.slice(0, 3)) {
    for (let m = 1; m <= 5; m++) {
      paymentData.push({
        studentId: student.id,
        groupId: groups[0].id,
        amount: 800000,
        paidAmount: m <= 4 ? 800000 : 0,
        debt: m <= 4 ? 0 : 800000,
        dueDate: new Date(2024, m - 1, 5),
        paidDate: m <= 4 ? new Date(2024, m - 1, 3) : null,
        status: m <= 4 ? ('PAID' as const) : ('OVERDUE' as const),
        method: 'CASH' as const,
        month: m,
        year: 2024,
      });
    }
  }
  await prisma.payment.createMany({ data: paymentData });

  // === ATTENDANCE (last 10 days) ===
  const attendanceDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i * 2);
    return d;
  });

  for (const date of attendanceDates) {
    await prisma.attendance.createMany({
      data: students.slice(0, 3).map((s, idx) => ({
        groupId: groups[0].id,
        studentId: s.id,
        teacherId: teachers[0].id,
        date,
        status: idx === 1 && date.getDate() % 3 === 0 ? 'ABSENT' : 'PRESENT',
      })),
    });
  }

  // === NOTIFICATIONS ===
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (adminUser) {
    await prisma.notification.createMany({
      data: [
        { userId: adminUser.id, title: 'Tizimga xush kelibsiz!', message: 'EduCRM Pro da ishlashni boshlang', type: 'INFO' },
        { userId: adminUser.id, title: "Qarzdor o'quvchilar", message: "3 ta o'quvchi to'lov qilmagan", type: 'DEBT_ALERT' },
      ],
    });
  }

  console.log('✅ Seeding completed!');
  console.log('\n📋 Test credentials:');
  console.log('  SuperAdmin: superadmin@educrm.pro / Admin@123');
  console.log('  Admin:      admin@educrm.pro / Admin@123');
  console.log('  Manager:    manager@educrm.pro / Manager@123');
  console.log('  Teacher:    john.smith@educrm.pro / Teacher@123');
  console.log('  Student:    bobur@student.com / Student@123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
