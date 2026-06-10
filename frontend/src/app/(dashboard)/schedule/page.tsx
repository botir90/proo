'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Users2, BookOpen, CheckCircle2, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { lessonsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { format, parseISO, isToday } from 'date-fns';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

// ── Lesson card for the schedule ─────────────────────────────────────────────
function LessonScheduleCard({ lesson, isAdmin }: { lesson: any; isAdmin: boolean }) {
  const todayLesson = isToday(parseISO(lesson.lessonDate));
  const statusColor = lesson.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : todayLesson ? 'bg-primary/5 border-primary/30' : 'bg-card';
  return (
    <div className={`rounded-lg border p-3 ${statusColor}`} style={{ borderLeftColor: lesson.group?.course?.color || '#6366f1', borderLeftWidth: 4 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{lesson.title}</p>
          <p className="text-xs text-muted-foreground truncate">{lesson.group?.course?.name} · {lesson.group?.name}</p>
        </div>
        <Badge variant={lesson.status === 'COMPLETED' ? 'default' : 'outline'} className="text-xs shrink-0">
          {format(parseISO(lesson.lessonDate), 'HH:mm')}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.duration} daq</span>
        {lesson.topic && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{lesson.topic}</span>}
        {isAdmin && lesson.teacher && (
          <span className="flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            {lesson.teacher.user?.firstName} {lesson.teacher.user?.lastName}
          </span>
        )}
        {lesson.status === 'COMPLETED' && (
          <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />O'tildi</span>
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

  // Lessons
  const { data: teacherLessonsData, isLoading: tLoading } = useQuery({
    queryKey: ['lessons', 'my'],
    queryFn: () => lessonsApi.getMyLessons(),
    enabled: isTeacher,
  });
  const { data: studentLessonsData, isLoading: sLoading } = useQuery({
    queryKey: ['lessons', 'student'],
    queryFn: () => lessonsApi.getStudentLessons(),
    enabled: isStudent,
  });
  const { data: adminLessonsData, isLoading: aLoading } = useQuery({
    queryKey: ['lessons', 'all'],
    queryFn: () => lessonsApi.getAllLessons(),
    enabled: isAdmin,
  });

  const isLoading = tLoading || sLoading || aLoading;

  const allLessons: any[] = isTeacher
    ? (teacherLessonsData?.data?.data ?? [])
    : isStudent
    ? (studentLessonsData?.data?.data ?? [])
    : (adminLessonsData?.data?.data ?? []);

  // Group lessons by day-of-week (Mon=0..Sun=6)
  const lessonsByDay: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  allLessons.forEach(l => {
    const d = (new Date(l.lessonDate).getDay() + 6) % 7;
    lessonsByDay[d].push(l);
  });
  // Sort each day by time
  Object.values(lessonsByDay).forEach(arr => arr.sort((a, b) => a.lessonDate.localeCompare(b.lessonDate)));

  const today = (new Date().getDay() + 6) % 7;
  const todayLessons = lessonsByDay[today] ?? [];

  const hasLessons = allLessons.length > 0;

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
            <Badge className="ml-1">{todayLessons.length} ta dars</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : todayLessons.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
              Bugun dars yo'q — dam oling! 🎉
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todayLessons.map(l => (
                <LessonScheduleCard key={l.id} lesson={l} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Haftalik jadval */}
      {!hasLessons && !isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium">Darslar topilmadi</p>
            <p className="text-xs mt-1">
              {isStudent
                ? "Siz hali hech bir guruhga qo'shilmagansiz"
                : "Darslar qo'shilganda bu yerda ko'rinadi"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Haftalik jadval</h2>
          <div className="grid gap-3">
            {DAYS.map((dayName, dayIdx) => {
              const dayLessons = lessonsByDay[dayIdx] ?? [];
              const isTodayDay = dayIdx === today;
              return (
                <div key={dayIdx}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className={`text-sm font-semibold ${isTodayDay ? 'text-primary' : 'text-muted-foreground'}`}>
                      {dayName}
                    </h3>
                    {isTodayDay && <Badge className="h-4 text-[10px]">Bugun</Badge>}
                    {dayLessons.length > 0 && (
                      <span className="text-xs text-muted-foreground">{dayLessons.length} ta dars</span>
                    )}
                  </div>
                  {dayLessons.length === 0 ? (
                    <div className="border border-dashed rounded-lg py-2 px-4 text-center text-xs text-muted-foreground">
                      Dars yo'q
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {dayLessons.map(l => (
                        <LessonScheduleCard key={l.id} lesson={l} isAdmin={isAdmin} />
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
