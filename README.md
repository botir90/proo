# EduCRM Pro

Production-grade Education CRM System — NestJS + Next.js

## Tezkor Ishga Tushirish

### 1. Docker bilan (tavsiya etiladi)

```bash
# .env faylini yarating
cp backend/.env.example backend/.env

# Docker Compose bilan ishga tushiring
docker compose up -d

# Database seed qiling
docker exec educrm-backend npx ts-node prisma/seed.ts
```

**Manzillar:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Swagger Docs: http://localhost:3001/api/docs
- pgAdmin: http://localhost:5050 (faqat `--profile tools` bilan)

---

### 2. Lokal Ishga Tushirish

#### Backend
```bash
cd backend
npm install

# PostgreSQL ishga tushiring (yoki Docker)
docker run -d --name educrm-pg \
  -e POSTGRES_DB=educrm_pro \
  -e POSTGRES_PASSWORD=educrm_secret_2024 \
  -p 5432:5432 postgres:16-alpine

# .env sozlang
cp .env.example .env

# Migration va seed
npx prisma migrate dev --name init
npx prisma generate
npx ts-node prisma/seed.ts

# Serverni ishga tushiring
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Test Hisoblar

| Rol | Email | Parol |
|-----|-------|-------|
| Super Admin | superadmin@educrm.pro | Admin@123 |
| Admin | admin@educrm.pro | Admin@123 |
| Menejer | manager@educrm.pro | Manager@123 |
| O'qituvchi | john.smith@educrm.pro | Teacher@123 |
| O'quvchi | bobur@student.com | Student@123 |

---

## API Endpointlar

### Auth
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | /api/v1/auth/register | Ro'yxatdan o'tish |
| POST | /api/v1/auth/login | Kirish |
| POST | /api/v1/auth/logout | Chiqish |
| POST | /api/v1/auth/refresh | Token yangilash |
| POST | /api/v1/auth/forgot-password | Parolni unutish |
| POST | /api/v1/auth/reset-password | Parolni tiklash |
| GET | /api/v1/auth/profile | Profil ma'lumoti |

### Students
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | /api/v1/students?page=1&limit=10&search= | Barcha o'quvchilar |
| GET | /api/v1/students/:id | O'quvchi ma'lumoti |
| POST | /api/v1/students | Yangi o'quvchi |
| PATCH | /api/v1/students/:id | O'quvchini yangilash |
| DELETE | /api/v1/students/:id | O'quvchini o'chirish |
| POST | /api/v1/students/:id/photo | Rasm yuklash |

### Teachers
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | /api/v1/teachers | Barcha o'qituvchilar |
| POST | /api/v1/teachers | Yangi o'qituvchi |
| PATCH | /api/v1/teachers/:id | Yangilash |
| DELETE | /api/v1/teachers/:id | O'chirish |

### Courses
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | /api/v1/courses | Kurslar ro'yxati |
| POST | /api/v1/courses | Yangi kurs |
| PATCH | /api/v1/courses/:id | Yangilash |
| DELETE | /api/v1/courses/:id | O'chirish |

### Groups
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | /api/v1/groups | Guruhlar ro'yxati |
| POST | /api/v1/groups | Yangi guruh |
| GET | /api/v1/groups/:id/students | Guruh o'quvchilari |
| POST | /api/v1/groups/:id/students | O'quvchi qo'shish |
| DELETE | /api/v1/groups/:id/students/:studentId | O'quvchini chiqarish |

### Attendance
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | /api/v1/attendance | Davomat qabul qilish |
| GET | /api/v1/attendance/group/:id | Guruh davomati |
| GET | /api/v1/attendance/student/:id | O'quvchi davomati |
| GET | /api/v1/attendance/group/:id/stats | Statistika |

### Payments
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | /api/v1/payments | To'lovlar ro'yxati |
| POST | /api/v1/payments | Yangi to'lov |
| PATCH | /api/v1/payments/:id | To'lovni yangilash |
| GET | /api/v1/payments/revenue/:year | Yillik daromad |
| GET | /api/v1/payments/student/:id/debt | O'quvchi qarzi |
| POST | /api/v1/payments/generate-invoices | Oylik hisob-faktura |

### Dashboard
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | /api/v1/dashboard | Umumiy statistika |
| GET | /api/v1/dashboard/revenue-chart | Daromad grafigi |
| GET | /api/v1/dashboard/groups-overview | Faol guruhlar |

---

## Texnologiyalar

### Backend
- **NestJS** — Node.js framework
- **PostgreSQL** — Ma'lumotlar bazasi
- **Prisma ORM** — Database ORM
- **JWT** — Authentication (Access + Refresh tokens)
- **Passport.js** — Auth middleware
- **Swagger/OpenAPI** — API dokumentatsiya
- **bcryptjs** — Parol shifrlash
- **class-validator** — DTO validatsiya
- **Docker** — Containerization

### Frontend
- **Next.js 14** — React framework (App Router)
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **Shadcn/UI** — UI components
- **React Query** — Server state management
- **Zustand** — Client state management
- **Axios** — HTTP client
- **React Hook Form + Zod** — Form validation
- **Recharts** — Grafiklar

---

## Loyiha Strukturasi

```
EduCRM-Pro/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # JWT auth, refresh token
│   │   │   ├── users/         # Foydalanuvchi boshqaruvi
│   │   │   ├── students/      # O'quvchilar
│   │   │   ├── teachers/      # O'qituvchilar
│   │   │   ├── courses/       # Kurslar
│   │   │   ├── groups/        # Guruhlar
│   │   │   ├── attendance/    # Davomat
│   │   │   ├── payments/      # To'lovlar
│   │   │   ├── dashboard/     # Statistika
│   │   │   ├── notifications/ # Bildirishnomalar
│   │   │   └── reports/       # Hisobotlar
│   │   ├── common/
│   │   │   ├── decorators/    # @Roles, @CurrentUser, @Public
│   │   │   ├── filters/       # Global exception filter
│   │   │   ├── guards/        # JWT, Roles guards
│   │   │   ├── interceptors/  # Transform, Logging
│   │   │   └── utils/         # Pagination helper
│   │   └── prisma/            # Database service
│   └── prisma/
│       ├── schema.prisma      # DB schema
│       └── seed.ts            # Test ma'lumotlar
├── frontend/
│   └── src/
│       ├── app/               # Next.js App Router
│       ├── components/        # UI komponentlar
│       ├── lib/               # API, utils
│       ├── stores/            # Zustand stores
│       └── types/             # TypeScript types
└── docker-compose.yml
```
