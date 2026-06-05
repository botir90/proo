'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Clock, AlertCircle,
  CreditCard, ClipboardCheck, BookOpen, GraduationCap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency, formatDate, getMonthName, getInitials } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function useParentFetch<T>(path: string) {
  const { accessToken } = useAuthStore();
  return useQuery<T>({
    queryKey: ['parent', path],
    queryFn: () =>
      fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json())
        .then(j => j.data),
    enabled: !!accessToken,
    retry: false,
  });
}

const attIcon: Record<string, any> = {
  PRESENT: CheckCircle2, ABSENT: XCircle, LATE: Clock, EXCUSED: AlertCircle,
};
const attColor: Record<string, string> = {
  PRESENT: 'text-green-600', ABSENT: 'text-red-500', LATE: 'text-yellow-500', EXCUSED: 'text-blue-500',
};
const attLabel: Record<string, string> = {
  PRESENT: 'Keldi', ABSENT: 'Kelmadi', LATE: 'Kechikdi', EXCUSED: 'Sababli',
};
const payColor: Record<string, string> = {
  PAID: 'text-green-600', PENDING: 'text-yellow-600', PARTIAL: 'text-blue-600', OVERDUE: 'text-red-600',
};
const payLabel: Record<string, string> = {
  PAID: "To'langan", PENDING: 'Kutilmoqda', PARTIAL: 'Qisman', OVERDUE: "Muddati o'tgan",
};

export default function ParentDashboardPage() {
  const { user } = useAuthStore();
  const { data: myHW } = useParentFetch<any>('/homework/my');
  const { data: myPayments } = useParentFetch<any>('/payments/my-payments');

  const homeworks: any[] = myHW?.data ?? [];
  const payInfo = myPayments?.data ?? { payments: [], totalDebt: 0, totalPaid: 0 };
  const payments: any[] = payInfo.payments ?? [];

  const pendingHW = homeworks.filter(h => !h.submissions?.[0]?.isDone).length;
  const doneHW    = homeworks.filter(h =>  h.submissions?.[0]?.isDone).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Sarlavha */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
            {getInitials(user?.firstName ?? '', user?.lastName ?? '')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" /> O'quvchi — Ota-ona portali
          </p>
        </div>
      </div>

      {/* Umumiy statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-red-700">{formatCurrency(payInfo.totalDebt)}</p>
            <p className="text-xs text-red-600">Qarz</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-green-700">{formatCurrency(payInfo.totalPaid)}</p>
            <p className="text-xs text-green-600">To'langan</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{pendingHW}</p>
            <p className="text-xs text-yellow-600">Bajarilmagan vazifa</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{doneHW}</p>
            <p className="text-xs text-blue-600">Bajarilgan vazifa</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> To'lovlar
          </TabsTrigger>
          <TabsTrigger value="homework" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Vazifalar
          </TabsTrigger>
        </TabsList>

        {/* To'lovlar */}
        <TabsContent value="payments" className="mt-4 space-y-3">
          {payments.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">To'lovlar yo'q</CardContent></Card>
          ) : payments.map((p: any) => (
            <Card key={p.id} className={p.status === 'OVERDUE' ? 'border-red-300' : ''}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.group?.course?.name}</p>
                  <p className="text-xs text-muted-foreground">{getMonthName(p.month)} {p.year} • Muddat: {formatDate(p.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${payColor[p.status]}`}>{payLabel[p.status]}</p>
                  {Number(p.debt) > 0 && (
                    <p className="text-xs text-red-500">Qarz: {formatCurrency(Number(p.debt))}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Vazifalar */}
        <TabsContent value="homework" className="mt-4 space-y-3">
          {homeworks.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Vazifalar yo'q</CardContent></Card>
          ) : homeworks.map((hw: any) => {
            const done = hw.submissions?.[0]?.isDone;
            return (
              <Card key={hw.id} className={done ? 'opacity-60' : ''}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className={`font-medium text-sm ${done ? 'line-through' : ''}`}>{hw.title}</p>
                    <p className="text-xs text-muted-foreground">{hw.group?.course?.name}</p>
                    {hw.dueDate && <p className="text-xs text-muted-foreground">Muddat: {formatDate(hw.dueDate)}</p>}
                  </div>
                  <Badge variant={done ? 'outline' : 'secondary'} className={done ? 'text-green-600 border-green-300' : 'text-yellow-600'}>
                    {done ? '✓ Bajarildi' : 'Bajarilmagan'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Muammo bo'lsa o'quv markazi bilan bog'laning
      </p>
    </div>
  );
}
