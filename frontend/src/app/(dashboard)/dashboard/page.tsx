'use client';

import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap, School, BookOpen, Users2, TrendingUp, TrendingDown,
  CreditCard, AlertCircle, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, getInitials, getAvatarUrl, getMonthName } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  FINISHED: 'bg-gray-500',
  PAUSED: 'bg-yellow-500',
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard', 'revenue-chart'],
    queryFn: () => dashboardApi.getRevenueChart(),
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

  const statCards = [
    {
      title: "Jami o'quvchilar",
      value: stats?.totalStudents?.value || 0,
      growth: stats?.totalStudents?.growth || 0,
      icon: GraduationCap,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950',
    },
    {
      title: "Jami o'qituvchilar",
      value: stats?.totalTeachers?.value || 0,
      growth: stats?.totalTeachers?.growth || 0,
      icon: School,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Faol kurslar',
      value: stats?.totalCourses?.value || 0,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: 'Faol guruhlar',
      value: stats?.activeGroups?.value || 0,
      subtitle: `${stats?.activeGroups?.total || 0} ta jami`,
      icon: Users2,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: "Bu oylik daromad",
      value: formatCurrency(stats?.monthlyRevenue?.value || 0),
      growth: stats?.monthlyRevenue?.growth,
      icon: CreditCard,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-950',
      isRevenue: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Xush kelibsiz, {user?.firstName}! Bu ko'rinish tizim holatini ko'rsatadi.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium">{card.title}</CardDescription>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
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

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Oylik daromad</CardTitle>
            <CardDescription>Bu yilgi daromad dinamikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
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
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Daromad']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Active Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faol guruhlar</CardTitle>
            <CardDescription>{groups.length} ta faol guruh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {groups.slice(0, 6).map((group: any) => (
              <div key={group.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.course?.color || '#6366f1' }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.course?.name}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {group._count?.members || 0} ta
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yangi o'quvchilar</CardTitle>
            <CardDescription>So'ngi qo'shilgan o'quvchilar</CardDescription>
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

        {/* Overdue Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Muddati o'tgan to'lovlar
            </CardTitle>
            <CardDescription>{overduePayments.length} ta to'lov kutilmoqda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overduePayments.slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {payment.student?.user?.firstName} {payment.student?.user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{getMonthName(payment.month)} {payment.year}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-destructive flex-shrink-0">
                  {formatCurrency(Number(payment.debt))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
