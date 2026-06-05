import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Barcha ma'lumotlar o'chirilmoqda...");

  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Foydalanuvchilar yaratilmoqda...');

  const hash = (pwd: string) => bcrypt.hash(pwd, 12);

  // SUPER ADMIN
  await prisma.user.create({
    data: {
      email: 'superadmin@educrm.pro',
      password: await hash('Super@123'),
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+998901111111',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // ADMIN
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

  // MANAGER
  await prisma.user.create({
    data: {
      email: 'manager@educrm.pro',
      password: await hash('Manager@1'),
      firstName: 'Malika',
      lastName: 'Yusupova',
      phone: '+998903333333',
      role: Role.MANAGER,
      status: UserStatus.ACTIVE,
    },
  });

  // TEACHER
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@educrm.pro',
      password: await hash('Teacher@1'),
      firstName: 'John',
      lastName: 'Smith',
      phone: '+998904444444',
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
    },
  });
  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      subjects: ['English', 'IELTS'],
      salary: 5000000,
      experience: 5,
    },
  });

  // STUDENT
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@educrm.pro',
      password: await hash('Student@1'),
      firstName: 'Bobur',
      lastName: 'Aliyev',
      phone: '+998905555555',
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });
  await prisma.student.create({
    data: { userId: studentUser.id, parentPhone: '+998906666666' },
  });

  console.log('\n✅ Seed muvaffaqiyatli yakunlandi!');
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log("│                   LOGIN MA'LUMOTLARI                   │");
  console.log('├─────────────┬──────────────────────────┬───────────────┤');
  console.log('│ Role        │ Email                    │ Parol         │');
  console.log('├─────────────┼──────────────────────────┼───────────────┤');
  console.log('│ SUPER ADMIN │ superadmin@educrm.pro    │ Super@123     │');
  console.log('│ ADMIN       │ admin@educrm.pro         │ Admin@123     │');
  console.log('│ MANAGER     │ manager@educrm.pro       │ Manager@1     │');
  console.log('│ TEACHER     │ teacher@educrm.pro       │ Teacher@1     │');
  console.log('│ STUDENT     │ student@educrm.pro       │ Student@1     │');
  console.log('├─────────────┼──────────────────────────┼───────────────┤');
  console.log('│ OTA-ONA     │ +998906666666 (tel)      │ (parol yo\'q) │');
  console.log('└─────────────┴──────────────────────────┴───────────────┘\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
