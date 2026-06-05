'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Phone, Mail, BookOpen, Users2, Banknote,
  CheckCircle2, Clock, Star, Award, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { teachersApi } from '@/lib/api';
import { getInitials, formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [payMonth, setPayMonth] = useState(new Date().getMonth());
  const [payYear, setPayYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => teachersApi.getOne(id),
    enabled: !!id,
  });

  const teacher = data?.data?.data;

  // Ish haqi to'landimi degan xabarni notifications orqali yuboramiz
  const payMutation = useMutation({
    mutationFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('educrm-auth') || '{}')?.state?.accessToken ?? ''}`,
        },
        body: JSON.stringify({
          userId: teacher?.user?.id,
          title: `Ish haqi to'landi — ${MONTHS[payMonth]} ${payYear}`,
          message: `${MONTHS[payMonth]} ${payYear} uchun ish haqingiz to'landi: ${formatCurrency(Number(teacher?.salary))}`,
          type: 'SUCCESS',
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: `${MONTHS[payMonth]} ish haqi to'landi ✓` });
      setSalaryOpen(false);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast({ title: 'Xato', variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!teacher) return null;

  const u = teacher.user;
  const groups: any[] = teacher.groups ?? [];
  const totalStudents = groups.reduce((s: number, g: any) => s + (g._count?.members ?? 0), 0);
  const monthlySalary = Number(teacher.salary);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Oylar ro'yxati (joriy yil + o'tgan yil bir oylik)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = (currentMonth - i + 12) % 12;
    const y = currentYear - (currentMonth - i < 0 ? 1 : 0);
    return { month: m, year: y, label: `${MONTHS[m]} ${y}` };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Orqaga
      </Button>

      {/* Sarlavha kartochkasi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                {getInitials(u?.firstName, u?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{u?.firstName} {u?.lastName}</h1>
                <Badge variant={u?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {u?.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {u?.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{u.email}</div>}
                {u?.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{u.phone}</div>}
                <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />{teacher.experience} yil tajriba</div>
              </div>
              {teacher.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {teacher.subjects.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}
              {teacher.bio && <p className="text-sm text-muted-foreground mt-2">{teacher.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <BookOpen className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{groups.length}</p>
            <p className="text-xs text-muted-foreground">Faol guruhlar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users2 className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">O'quvchilar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Award className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{teacher.experience}</p>
            <p className="text-xs text-muted-foreground">Yil tajriba</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4 pb-3 text-center">
            <Banknote className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-700">{formatCurrency(monthlySalary)}</p>
            <p className="text-xs text-green-600">Oylik ish haqi</p>
          </CardContent>
        </Card>
      </div>

      {/* Ish haqi to'lash */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Ish haqi boshqaruvi
          </CardTitle>
          <Button size="sm" onClick={() => setSalaryOpen(true)} className="gap-2">
            <Banknote className="h-4 w-4" /> Ish haqi to'lash
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthOptions.slice(0, 6).map(({ month, year, label }) => (
              <div key={`${month}-${year}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">Oylik: {formatCurrency(monthlySalary)}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={() => { setPayMonth(month); setPayYear(year); setSalaryOpen(true); }}
                >
                  <CheckCircle2 className="h-3 w-3" /> To'lash
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Faol guruhlar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Faol guruhlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">Faol guruhlar yo'q</p>
          ) : groups.map((g: any) => (
            <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.course?.color ?? '#6366f1' }} />
                <div>
                  <p className="font-medium text-sm">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.course?.name} • {g.schedule || 'Jadval yo\'q'}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                <Users2 className="h-3 w-3 mr-1" />
                {g._count?.members ?? 0} o'quvchi
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ish haqi to'lash dialogi */}
      <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ish haqi to'lash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">O'qituvchi</span>
                <span className="font-medium">{u?.firstName} {u?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oy</span>
                <span className="font-medium">{MONTHS[payMonth]} {payYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guruhlar</span>
                <span className="font-medium">{groups.length} ta</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Summa</span>
                <span className="font-bold text-green-600 text-base">{formatCurrency(monthlySalary)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              To'lov tasdiqlangach o'qituvchi bildirishnoma oladi.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSalaryOpen(false)}>Bekor</Button>
              <Button className="flex-1" onClick={() => payMutation.mutate()} disabled={payMutation.isPending}>
                {payMutation.isPending ? 'Yuklanmoqda...' : "To'lash"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
