'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Users2,
  CreditCard, ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { studentsApi, reportsApi } from '@/lib/api';
import { getInitials, formatCurrency, formatDate, getMonthName } from '@/lib/utils';

const statusIcon: Record<string, any> = {
  PRESENT: CheckCircle2, ABSENT: XCircle, LATE: Clock, EXCUSED: AlertCircle,
};
const statusColor: Record<string, string> = {
  PRESENT: 'text-green-600', ABSENT: 'text-red-500', LATE: 'text-yellow-500', EXCUSED: 'text-blue-500',
};
const statusLabel: Record<string, string> = {
  PRESENT: 'Keldi', ABSENT: 'Kelmadi', LATE: 'Kechikdi', EXCUSED: 'Sababli',
};
const payStatusColor: Record<string, string> = {
  PAID: 'text-green-600', PENDING: 'text-yellow-600', PARTIAL: 'text-blue-600', OVERDUE: 'text-red-600',
};
const payStatusLabel: Record<string, string> = {
  PAID: "To'langan", PENDING: 'Kutilmoqda', PARTIAL: 'Qisman', OVERDUE: "Muddati o'tgan",
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getOne(id),
    enabled: !!id,
  });

  const { data: reportData } = useQuery({
    queryKey: ['student-report', id],
    queryFn: () => reportsApi.getStudentReport(id),
    enabled: !!id,
  });

  const student = studentData?.data?.data;
  const report = reportData?.data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!student) return null;

  const u = student.user;
  const attStats = report?.summary ?? { totalPaid: 0, totalDebt: 0, attendanceRate: 0, totalClasses: 0 };
  const payments: any[] = report?.student?.payments ?? [];
  const attendance: any[] = report?.student?.attendance?.slice(0, 30) ?? [];
  const groups: any[] = student.groupMembers ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Orqaga */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Orqaga
      </Button>

      {/* Sarlavha kartochkasi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                {getInitials(u?.firstName, u?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{u?.firstName} {u?.lastName}</h1>
                <Badge variant={u?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {u?.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {u?.email && (
                  <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{u.email}</div>
                )}
                {u?.phone && (
                  <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{u.phone}</div>
                )}
                {student.address && (
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{student.address}</div>
                )}
                {student.birthDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(student.birthDate)}
                    {student.gender && <span>• {student.gender === 'MALE' ? 'Erkak' : 'Ayol'}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Guruhlar</p>
            <p className="text-3xl font-bold text-primary mt-1">{groups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Davomat</p>
            <p className={`text-3xl font-bold mt-1 ${attStats.attendanceRate >= 80 ? 'text-green-600' : attStats.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {attStats.attendanceRate}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">To'langan</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(attStats.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Qarz</p>
            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(attStats.totalDebt)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="groups">
        <TabsList className="grid grid-cols-3 max-w-sm">
          <TabsTrigger value="groups" className="gap-1.5">
            <Users2 className="h-3.5 w-3.5" /> Guruhlar
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> To'lovlar
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" /> Davomat
          </TabsTrigger>
        </TabsList>

        {/* Guruhlar */}
        <TabsContent value="groups" className="mt-4 space-y-3">
          {groups.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Guruhga qo'shilmagan</CardContent></Card>
          ) : groups.map((gm: any) => (
            <Card key={gm.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gm.group?.course?.color ?? '#6366f1' }} />
                  <div>
                    <p className="font-medium">{gm.group?.name}</p>
                    <p className="text-sm text-muted-foreground">{gm.group?.course?.name}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{gm.group?.schedule || '-'}</p>
                  <p>{gm.group?.room || ''}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* To'lovlar */}
        <TabsContent value="payments" className="mt-4 space-y-2">
          {payments.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">To'lovlar mavjud emas</CardContent></Card>
          ) : payments.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{getMonthName(p.month)} {p.year}</p>
                  <p className="text-xs text-muted-foreground">Muddat: {formatDate(p.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${payStatusColor[p.status]}`}>
                    {payStatusLabel[p.status]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(p.paidAmount))} / {formatCurrency(Number(p.amount))}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Davomat */}
        <TabsContent value="attendance" className="mt-4 space-y-2">
          {attendance.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Davomat ma'lumotlari yo'q</CardContent></Card>
          ) : attendance.map((a: any) => {
            const Icon = statusIcon[a.status] ?? CheckCircle2;
            return (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg border hover:bg-muted/40">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${statusColor[a.status]}`} />
                  <div>
                    <p className="text-sm font-medium">{formatDate(a.date)}</p>
                    {a.note && <p className="text-xs text-muted-foreground">{a.note}</p>}
                  </div>
                </div>
                <span className={`text-sm font-medium ${statusColor[a.status]}`}>
                  {statusLabel[a.status]}
                </span>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
