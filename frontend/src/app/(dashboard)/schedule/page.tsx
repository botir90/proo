'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { groupsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const DAY_SHORT: Record<string, number> = {
  du: 0, se: 1, ch: 2, pa: 3, ju: 4, sh: 5, ya: 6,
  mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6,
  дш: 0, сш: 1, чш: 2, пш: 3, жш: 4, шб: 5, як: 6,
};

// "Du,Cho,Ju 14:00-16:00" yoki "Mon,Wed,Fri 14:00-16:00" formatini parse qiladi
function parseSchedule(schedule: string): { days: number[]; time: string } {
  if (!schedule) return { days: [], time: '' };
  const parts = schedule.split(/\s+/);
  const timePart = parts.find(p => p.includes(':')) ?? '';
  const daysPart = parts.filter(p => !p.includes(':')).join(' ');

  const days: number[] = [];
  // Vergul bilan ajratilgan kunlarni olish
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

export default function SchedulePage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';

  const { data: allData } = useQuery({
    queryKey: ['groups', 'schedule-all'],
    queryFn: () => groupsApi.getAll({ limit: 100 }),
    enabled: !isTeacher,
  });
  const { data: myData } = useQuery({
    queryKey: ['groups', 'my-groups'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: isTeacher,
  });

  const rawGroups = isTeacher
    ? (myData?.data?.data ?? [])
    : (allData?.data?.data?.items ?? []);

  const groups: ScheduleGroup[] = rawGroups
    .filter((g: any) => g.status === 'ACTIVE' && g.schedule)
    .map((g: any) => {
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
    });

  const today = (new Date().getDay() + 6) % 7; // 0=Dushanba

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dars jadvali</h1>
        <p className="text-muted-foreground">Haftalik jadval — faol guruhlar</p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p>Jadval ma'lumotlari yo'q</p>
            <p className="text-xs mt-1">Guruh jadvalini guruhlar sahifasida kiriting</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {DAYS.map((dayName, dayIdx) => {
            const dayGroups = groups.filter(g => g.days.includes(dayIdx));
            const isToday = dayIdx === today;
            return (
              <div key={dayIdx}>
                <div className={`flex items-center gap-3 mb-2`}>
                  <h2 className={`text-sm font-semibold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {dayName}
                  </h2>
                  {isToday && <Badge className="text-xs h-5">Bugun</Badge>}
                  {dayGroups.length > 0 && (
                    <span className="text-xs text-muted-foreground">{dayGroups.length} ta dars</span>
                  )}
                </div>

                {dayGroups.length === 0 ? (
                  <div className="border border-dashed rounded-lg py-3 px-4 text-center text-xs text-muted-foreground">
                    Dars yo'q
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {dayGroups
                      .sort((a, b) => (a.time > b.time ? 1 : -1))
                      .map(g => (
                        <div
                          key={`${g.id}-${dayIdx}`}
                          className={`rounded-lg border p-3 ${isToday ? 'shadow-sm' : ''}`}
                          style={{ borderLeftColor: g.color, borderLeftWidth: 4 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{g.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{g.courseName}</p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">{g.time || '—'}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {g.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{g.room}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users2 className="h-3 w-3" />{g.members} o'q
                            </span>
                            {!isTeacher && g.teacherName && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{g.teacherName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
