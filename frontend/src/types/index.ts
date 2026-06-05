export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT' | 'PARENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type GroupStatus = 'ACTIVE' | 'FINISHED' | 'PAUSED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PAYMENT_DUE' | 'DEBT_ALERT' | 'SYSTEM';
export type Gender = 'MALE' | 'FEMALE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: Role;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  teacherProfile?: Teacher;
  studentProfile?: Student;
}

export interface Teacher {
  id: string;
  userId: string;
  subjects: string[];
  salary: number;
  experience: number;
  bio?: string;
  user?: Partial<User>;
  groups?: Group[];
  _count?: { groups: number };
}

export interface Student {
  id: string;
  userId: string;
  parentPhone?: string;
  address?: string;
  birthDate?: string;
  gender?: Gender;
  notes?: string;
  user?: Partial<User>;
  groupMembers?: GroupMember[];
  _count?: { payments: number; attendance: number };
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  color?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { groups: number };
}

export interface Group {
  id: string;
  name: string;
  courseId: string;
  teacherId: string;
  startDate: string;
  endDate?: string;
  schedule?: string;
  room?: string;
  maxStudents: number;
  status: GroupStatus;
  course?: Course;
  teacher?: Teacher;
  members?: GroupMember[];
  _count?: { members: number };
}

export interface GroupMember {
  id: string;
  groupId: string;
  studentId: string;
  joinDate: string;
  isActive: boolean;
  student?: Student;
  group?: Group;
}

export interface Attendance {
  id: string;
  groupId: string;
  studentId: string;
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  student?: Student;
  group?: Group;
}

export interface Payment {
  id: string;
  studentId: string;
  groupId: string;
  amount: number;
  paidAmount: number;
  debt: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description?: string;
  month: number;
  year: number;
  student?: Student;
  group?: Group;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}
