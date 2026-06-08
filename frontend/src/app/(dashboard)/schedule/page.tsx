'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { groupsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const DAY_SHORT: Record<string, number> = {
  du: 0, se: 1, ch: 2, pa: 3, ju: 4, sh: 5, ya: 6,
  mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6,
};

function parseSchedule(schedule: string): { days: number[]; time: string } {
  if (!schedule) return { days: [], time: '' };
  const parts = schedule.split(/\s+/);
  const timePart = parts.find(p => p.includes(':')) ?? '';
  const daysPart = parts.filter(p => !p.includes(':')).join(' ');
  const days: number[] = [];
  daysPart.split(/[,\s]+/).forEach(d => {
    const key = d.toLowerCase().slice(0, 2);
    if (DAY_SHORT[key] !== undefined) days.push(DAY_SHORT[key]);
  });
  return { days: Array.from(new Set(days)).sort(), time: timePart };
}

interface ScheduleGroup {
  id: string;
  name: string;
  color: string;
  courseName: string;
  teacherName: string;
  room: string;
  days: number[];
  time: string;
  members: number;
}

function toScheduleGroup(g: any): ScheduleGroup {
  const parsed = parseSchedule(g.schedule ?? '');
  return {
    id: g.id,
    name: g.name,
    color: g.course?.color ?? '#6366f1',
    courseName: g.course?.name ?? '',
    teacherName: g.teacher ? `${g.teacher.user?.firstName ?? ''} ${g.teacher.user?.lastName ?? ''}`.trim() : '',
    room: g.room ?? '',
    days: parsed.days,
    time: parsed.time,
    members: g._count?.members ?? 0,
  };
}

function GroupCard({ g, isToday, showTeacher }: { g: ScheduleGroup; isToday: boolean; showTeacher: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${isToday ? 'shadow-sm bg-primary/5' : 'bg-card'}`}
      style={{ borderLeftColor: g.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{g.name}</p>
          <p className="text-xs text-muted-foreground truncate">{g.courseName}</p>
        </div>
        <Badge variant={isToday ? 'default' : 'outline'} className="text-xs shrink-0">
          {g.time || '—'}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {g.room && (
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{g.room}</span>
        )}
        <span className="flex items-center gap-1"><Users2 className="h-3 w-3" />{g.members} o'q</span>
        {showTeacher && g.teacherName && (
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{g.teacherName}</span>
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT' || user?.role === 'PARENT';
  const isAdmin   = !isTeacher && !isStudent;

  const { data: teacherData, isLoading: teacherLoading } = useQuery({
    queryKey: ['my-groups', 'schedule'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: isTeacher,
  });
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['my-student-groups', 'schedule'],
    queryFn: () => groupsApi.getMyStudentGroups(),
    enabled: isStudent,
  });
  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['groups', 'schedule-all'],
    queryFn: () => groupsApi.getAll({ limit: 200 }),
    enabled: isAdmin,
  });

  const isLoading = teacherLoading || studentLoading || allLoading;

  const rawGroups: any[] = isTeacher
    ? (teacherData?.data?.data ?? [])
    : isStudent
    ? (studentData?.data?.data ?? [])
    : (allData?.data?.data?.items ?? []);

  const groups: ScheduleGroup[] = rawGroups
    .filter((g: any) => g.status === 'ACTIVE' && g.schedule)
    .map(toScheduleGroup);

  const today = (new Date().getDay() + 6) % 7; // 0=Dushanba
  const todayGroups = groups.filter(g => g.days.includes(today)).sort((a, b) => (a.time > b.time ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dars jadvali</h1>
        <p className="text-muted-foreground">
          {isTeacher ? "Mening darslarim" : isStudent ? "Mening darslarim" : "Barcha guruhlar jadvali"}
        </p>
      </div>

      {/* Bugungi darslar */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Bugun — {DAYS[today]}
            <Badge className="ml-1">{todayGroups.length} ta dars</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : todayGroups.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
              Bugun dars yo'q — dam oling! 🎉
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todayGroups.map(g => (
                <GroupCard key={g.id} g={g} isToday showTeacher={isAdmin || isStudent} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Haftalik jadval */}
      {groups.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium">Jadval ma'lumotlari yo'q</p>
            <p className="text-xs mt-1">
              {isStudent
                ? "Siz hali hech bir guruhga qo'shilmagansiz"
                : "Guruh jadvalini guruhlar sahifasida kiriting"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Haftalik jadval</h2>
          <div className="grid gap-3">
            {DAYS.map((dayName, dayIdx) => {
              const dayGroups = groups.filter(g => g.days.includes(dayIdx)).sort((a, b) => (a.time > b.time ? 1 : -1));
              const isToday = dayIdx === today;
              return (
                <div key={dayIdx}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {dayName}
                    </h3>
                    {isToday && <Badge className="h-4 text-[10px]">Bugun</Badge>}
                    {dayGroups.length > 0 && (
                      <span className="text-xs text-muted-foreground">{dayGroups.length} ta dars</span>
                    )}
                  </div>
                  {dayGroups.length === 0 ? (
                    <div className="border border-dashed rounded-lg py-2 px-4 text-center text-xs text-muted-foreground">
                      Dars yo'q
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {dayGroups.map(g => (
                        <GroupCard key={`${g.id}-${dayIdx}`} g={g} isToday={isToday} showTeacher={isAdmin || isStudent} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
