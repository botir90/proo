'use client';

import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap, School, BookOpen, Users2, TrendingUp, TrendingDown,
  CreditCard, AlertCircle, Calendar, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi, paymentsApi, attendanceApi, groupsApi, lessonsApi } from '@/lib/api';
import { isToday, parseISO, format } from 'date-fns';
import { formatCurrency, getInitials, getAvatarUrl, getMonthName } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';

// ===================== ADMIN DASHBOARD =====================
function AdminDashboard() {
  const { user } = useAuthStore();
  const isManager = user?.role === 'MANAGER';

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
  });
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard', 'revenue-chart'],
    queryFn: () => dashboardApi.getRevenueChart(),
    enabled: !isManager,
  });
  const { data: groupsData } = useQuery({
    queryKey: ['dashboard', 'groups-overview'],
    queryFn: () => dashboardApi.getGroupsOverview(),
  });

  const stats = statsData?.data?.data?.stats;
  const chart = chartData?.data?.data?.chart || [];
  const groups = groupsData?.data?.data || [];
  const recentStudents = statsData?.data?.data?.recentStudents || [];
  const overduePayments = statsData?.data?.data?.overduePayments || [];

  const allStatCards = [
    { title: "Jami o'quvchilar", value: stats?.totalStudents?.value || 0, growth: stats?.totalStudents?.growth, icon: GraduationCap, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950', managerVisible: true },
    { title: "Jami o'qituvchilar", value: stats?.totalTeachers?.value || 0, growth: stats?.totalTeachers?.growth, icon: School, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', managerVisible: true },
    { title: 'Faol kurslar', value: stats?.totalCourses?.value || 0, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', managerVisible: true },
    { title: 'Faol guruhlar', value: stats?.activeGroups?.value || 0, subtitle: `${stats?.activeGroups?.total || 0} ta jami`, icon: Users2, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950', managerVisible: true },
    { title: 'Bu oylik daromad', value: formatCurrency(stats?.monthlyRevenue?.value || 0), growth: stats?.monthlyRevenue?.growth, icon: CreditCard, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950', isRevenue: true, managerVisible: false },
  ];
  const statCards = allStatCards.filter(c => !isManager || c.managerVisible);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Xush kelibsiz, {user?.firstName}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium">{card.title}</CardDescription>
                  <div className={`p-2 rounded-lg ${card.bg}`}><Icon className={`h-4 w-4 ${card.color}`} /></div>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.subtitle && <p className="text-xs text-muted-foreground">{card.subtitle}</p>}
                    {card.growth !== undefined && (
                      <div className={`flex items-center gap-1 text-xs mt-1 ${card.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {card.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {card.isRevenue ? `${card.growth}%` : `+${card.growth} bu oy`}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className={`grid gap-6 ${isManager ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        {!isManager && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Oylik daromad</CardTitle>
              <CardDescription>Bu yilgi daromad dinamikasi</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? <Skeleton className="h-64 w-full" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Daromad']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faol guruhlar</CardTitle>
            <CardDescription>{groups.length} ta faol guruh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {groups.slice(0, 6).map((group: any) => (
              <div key={group.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: group.course?.color || '#6366f1' }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.course?.name}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">{group._count?.members || 0} ta</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yangi o'quvchilar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentStudents.map((student: any) => (
              <div key={student.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={getAvatarUrl(student.user?.avatar)} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(student.user?.firstName, student.user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{student.user?.firstName} {student.user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{student.user?.email}</p>
                </div>
                <Badge variant="outline" className="text-xs">Yangi</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Muddati o'tgan to'lovlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overduePayments.slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{payment.student?.user?.firstName} {payment.student?.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{getMonthName(payment.month)} {payment.year}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-destructive flex-shrink-0">{formatCurrency(Number(payment.debt))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===================== STUDENT DASHBOARD =====================
function StudentDashboard() {
  const { user } = useAuthStore();
  const studentId = user?.studentProfile?.id;

  const { data: attendanceData } = useQuery({
    queryKey: ['my-attendance', studentId],
    queryFn: () => attendanceApi.getByStudent(studentId!, {}),
    enabled: !!studentId,
  });

  const { data: debtData } = useQuery({
    queryKey: ['my-debt', studentId],
    queryFn: () => paymentsApi.getStudentDebt(studentId!),
    enabled: !!studentId,
  });

  const { data: myGroupsData } = useQuery({
    queryKey: ['student-my-groups'],
    queryFn: () => groupsApi.getMyStudentGroups(),
  });

  const attendance = attendanceData?.data?.data?.attendance || [];
  const attendanceStats = attendanceData?.data?.data?.stats;
  const debt = debtData?.data?.data;
  const myGroups: any[] = myGroupsData?.data?.data || [];

  const recentAttendance = attendance.slice(0, 7);

  const todayIdx    = (new Date().getDay() + 6) % 7;
  const todayGroups = myGroups
    .filter(g => parseDays(g.schedule || '').includes(todayIdx))
    .sort((a: any, b: any) => (parseTime(a.schedule) > parseTime(b.schedule) ? 1 : -1));

  const statusConf: Record<string, any> = {
    PRESENT: { label: 'Keldi', icon: CheckCircle, color: 'text-green-500' },
    ABSENT:  { label: 'Kelmadi', icon: XCircle, color: 'text-red-500' },
    LATE:    { label: 'Kechikdi', icon: Clock, color: 'text-yellow-500' },
    EXCUSED: { label: 'Sababli', icon: AlertCircle, color: 'text-blue-500' },
  };

  const attendanceRate = attendanceStats?.total
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mening sahifam</h1>
        <p className="text-muted-foreground">Xush kelibsiz, {user?.firstName}!</p>
      </div>

      {/* Bugungi darslar */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Bugun — {DAYS_UZ[todayIdx]}
            <Badge className="ml-1 text-xs">{todayGroups.length} ta dars</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">Bugun dars yo'q 🎉</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todayGroups.map((g: any) => (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: g.course?.color || '#6366f1' }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.teacher?.user?.firstName} {g.teacher?.user?.lastName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{parseTime(g.schedule) || '—'}</p>
                    {g.room && <p className="text-xs text-muted-foreground">{g.room}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Jami darslar</p>
            <p className="text-2xl font-bold">{attendanceStats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Davomat %</p>
            <p className={`text-2xl font-bold ${attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
              {attendanceRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Kelmagan kunlar</p>
            <p className="text-2xl font-bold text-red-500">{attendanceStats?.absent || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Qarzdorlik</p>
            <p className={`text-2xl font-bold ${(debt?.totalDebt || 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatCurrency(debt?.totalDebt || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">So'ngi davomatim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Davomat ma'lumoti yo'q</p>
            ) : (
              recentAttendance.map((a: any) => {
                const conf = statusConf[a.status] || statusConf.PRESENT;
                const Icon = conf.icon;
                return (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{a.group?.course?.name || a.group?.name}</p>
                      <p className="text-xs text-muted-foreground">{a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : ''}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${conf.color}`}>
                      <Icon className="h-4 w-4" />
                      {conf.label}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Payment status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">To'lov holati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(debt?.payments || []).length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-600">Barcha to'lovlar amalga oshirilgan!</p>
              </div>
            ) : (
              debt?.payments?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="text-sm font-medium">{p.group?.course?.name}</p>
                    <p className="text-xs text-muted-foreground">{getMonthName(p.month)} {p.year}</p>
                  </div>
                  <span className="text-sm font-bold text-destructive">{formatCurrency(Number(p.debt))}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===================== SCHEDULE HELPERS =====================
const DAY_SHORT: Record<string, number> = {
  du: 0, se: 1, ch: 2, pa: 3, ju: 4, sh: 5, ya: 6,
  mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6,
};
const DAYS_UZ = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

function parseDays(schedule: string): number[] {
  if (!schedule) return [];
  const daysPart = schedule.split(/\s+/).filter(p => !p.includes(':'));
  const days: number[] = [];
  daysPart.join(' ').split(/[,\s]+/).forEach(d => {
    const k = d.toLowerCase().slice(0, 2);
    if (DAY_SHORT[k] !== undefined) days.push(DAY_SHORT[k]);
  });
  return Array.from(new Set(days));
}

function parseTime(schedule: string): string {
  return schedule?.split(/\s+/).find(p => p.includes(':')) ?? '';
}

// ===================== TEACHER DASHBOARD =====================
function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['teacher-my-groups'],
    queryFn: () => groupsApi.getMyGroups(),
  });
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', 'my'],
    queryFn: () => lessonsApi.getMyLessons(),
  });

  const isLoading = groupsLoading || lessonsLoading;
  const groups: any[]  = groupsData?.data?.data || [];
  const allLessons: any[] = lessonsData?.data?.data || [];
  const activeGroups   = groups.filter((g: any) => g.status === 'ACTIVE');
  const totalStudents  = groups.reduce((s: number, g: any) => s + (g._count?.members || 0), 0);
  const uniqueCourses  = new Set(groups.map((g: any) => g.courseId)).size;

  const todayIdx   = (new Date().getDay() + 6) % 7;
  const todayLessons = allLessons
    .filter((l: any) => isToday(parseISO(l.lessonDate)) && l.status !== 'CANCELLED')
    .sort((a: any, b: any) => a.lessonDate.localeCompare(b.lessonDate));

  const statCards = [
    { label: 'Jami guruhlar',    value: groups.length,                                             color: 'text-violet-600' },
    { label: 'Faol guruhlar',    value: activeGroups.length,                                       color: 'text-green-600' },
    { label: 'Jami darslar',     value: allLessons.length,                                         color: 'text-blue-600' },
    { label: "Jami o'quvchilar", value: totalStudents,                                             color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Xush kelibsiz, {user?.firstName} o'qituvchi!</p>
      </div>

      {/* Bugungi darslar */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Bugun — {DAYS_UZ[todayIdx]}
            <Badge className="ml-1 text-xs">{todayLessons.length} ta dars</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : todayLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">Bugun dars yo'q 🎉</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todayLessons.map((l: any) => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: l.group?.course?.color || '#6366f1' }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.group?.course?.name} · {l.group?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{format(parseISO(l.lessonDate), 'HH:mm')}</p>
                    <p className="text-xs text-muted-foreground">{l.duration} daq</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat kartalar */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {statCards.map(c => (
          <Card key={c.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              {isLoading
                ? <Skeleton className="h-8 w-16 mt-1" />
                : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guruhlar ro'yxati */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mening guruhlarim</CardTitle>
          <CardDescription>{groups.length} ta guruh</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {groupsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Guruhlar yo'q</p>
          ) : (
            groups.map((group: any) => (
              <div key={group.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.course?.color || '#6366f1' }} />
                  <div>
                    <p className="font-medium text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.course?.name}
                      {group.schedule && <> · <span className="text-primary/80">{group.schedule}</span></>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={group.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                    {group.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{group._count?.members || 0} o'q</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  if (user.role === 'STUDENT') return <StudentDashboard />;
  if (user.role === 'TEACHER') return <TeacherDashboard />;
  return <AdminDashboard />;
}
