'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ClipboardCheck, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reportsApi, groupsApi, exportApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatCurrency, getMonthName, MONTHS } from '@/lib/utils';

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [groupId, setGroupId] = useState('all');

  const { data: groupsData } = useQuery({ queryKey: ['groups', 'all'], queryFn: () => groupsApi.getAll({ limit: 100 }) });
  const groups = groupsData?.data?.data?.items || [];

  const { data: paymentReport, isLoading: prLoading } = useQuery({
    queryKey: ['reports', 'payment', month, year, groupId],
    queryFn: () => reportsApi.getPaymentReport({ month: parseInt(month), year: parseInt(year), groupId: groupId === 'all' ? undefined : groupId }),
  });

  const { data: attendanceReport, isLoading: arLoading } = useQuery({
    queryKey: ['reports', 'attendance', month, year, groupId],
    queryFn: () => reportsApi.getAttendanceReport({ month: parseInt(month), year: parseInt(year), groupId: groupId === 'all' ? undefined : groupId }),
  });

  const pr = paymentReport?.data?.data;
  const ar = attendanceReport?.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hisobotlar</h1>
          <p className="text-muted-foreground">To'lovlar va davomat hisobotlari</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportApi.downloadStudents()}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          O'quvchilar Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label>Oy</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Yil</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Guruh</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Barcha guruhlar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha guruhlar</SelectItem>
                  {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payments">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> To'lovlar
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Davomat
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => exportApi.downloadPayments({
                month: parseInt(month),
                year: parseInt(year),
                groupId: groupId !== 'all' ? groupId : undefined,
              })}
            >
              <Download className="h-3.5 w-3.5" /> To'lovlar Excel
            </Button>
            {groupId !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => exportApi.downloadAttendance(groupId)}
              >
                <Download className="h-3.5 w-3.5" /> Davomat Excel
              </Button>
            )}
          </div>
        </div>

        {/* Payment Report */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          {prLoading ? (
            <Card><CardContent className="pt-6 pb-6 text-center text-muted-foreground">Yuklanmoqda...</CardContent></Card>
          ) : pr && pr.summary.total > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Jami to'lovlar</p><p className="text-2xl font-bold">{pr.summary.total}</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">To'langan</p><p className="text-2xl font-bold text-green-600">{pr.summary.paid}</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Kutilayotgan</p><p className="text-2xl font-bold text-yellow-600">{pr.summary.pending + pr.summary.partial}</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Muddati o'tgan</p><p className="text-2xl font-bold text-destructive">{pr.summary.overdue}</p></CardContent></Card>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Jami summa</p><p className="text-lg font-bold">{formatCurrency(pr.summary.totalAmount)}</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">To'landi</p><p className="text-lg font-bold text-green-600">{formatCurrency(pr.summary.totalPaid)}</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Qoldiq qarz</p><p className="text-lg font-bold text-destructive">{formatCurrency(pr.summary.totalDebt)}</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">To'lovlar ro'yxati</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {pr.payments.slice(0, 20).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{p.student?.user?.firstName} {p.student?.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p.group?.course?.name} | {getMonthName(p.month)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(Number(p.paidAmount))}</p>
                        {Number(p.debt) > 0 && <p className="text-xs text-destructive">-{formatCurrency(Number(p.debt))}</p>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-8 pb-8 flex flex-col items-center gap-2 text-muted-foreground">
                <CreditCard className="w-10 h-10 opacity-30" />
                <p className="text-sm">Bu oy uchun to'lov ma'lumotlari yo'q</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Report */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          {arLoading ? (
            <Card><CardContent className="pt-6 pb-6 text-center text-muted-foreground">Yuklanmoqda...</CardContent></Card>
          ) : ar && ar.summary.total > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Jami darslar</p><p className="text-2xl font-bold">{ar.summary.total}</p></CardContent></Card>
              <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Keldi</p><p className="text-2xl font-bold text-green-600">{ar.summary.present}</p></CardContent></Card>
              <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Kelmadi</p><p className="text-2xl font-bold text-destructive">{ar.summary.absent}</p></CardContent></Card>
              <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Kechikdi</p><p className="text-2xl font-bold text-yellow-600">{ar.summary.late}</p></CardContent></Card>
              <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Davomat %</p><p className="text-2xl font-bold text-primary">{ar.summary.rate}%</p></CardContent></Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-8 pb-8 flex flex-col items-center gap-2 text-muted-foreground">
                <ClipboardCheck className="w-10 h-10 opacity-30" />
                <p className="text-sm">Bu oy uchun davomat ma'lumotlari yo'q</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
