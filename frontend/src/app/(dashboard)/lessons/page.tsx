'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video, Plus, Clock, CalendarDays, BookOpen, CheckCircle2, XCircle,
  ChevronRight, Users2, Pencil, Trash2, X, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth.store';
import { lessonsApi, groupsApi } from '@/lib/api';
import { format, isToday, isFuture, isPast, parseISO } from 'date-fns';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  try { return format(parseISO(d), 'dd.MM.yyyy HH:mm'); } catch { return d; }
}
function fmtDay(d: string) {
  try { return format(parseISO(d), 'dd.MM.yyyy'); } catch { return d; }
}
function fmtTime(d: string) {
  try { return format(parseISO(d), 'HH:mm'); } catch { return d; }
}

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  PLANNED:   { label: "Rejalashtirilgan", variant: 'secondary',    icon: CalendarDays },
  COMPLETED: { label: "O'tilgan",         variant: 'default',      icon: CheckCircle2 },
  CANCELLED: { label: 'Bekor qilingan',   variant: 'destructive',  icon: XCircle },
};

// ── Lesson Card ───────────────────────────────────────────────────────────────

function LessonCard({
  lesson, isTeacher, onEdit, onDelete, onMarkDone,
}: {
  lesson: any;
  isTeacher: boolean;
  onEdit?: (l: any) => void;
  onDelete?: (id: string) => void;
  onMarkDone?: (id: string) => void;
}) {
  const meta = STATUS_META[lesson.status] ?? STATUS_META.PLANNED;
  const StatusIcon = meta.icon;
  const todayLesson = isToday(parseISO(lesson.lessonDate));
  const upcoming = isFuture(parseISO(lesson.lessonDate));

  return (
    <div className={`rounded-xl border p-4 transition-all ${todayLesson ? 'border-primary bg-primary/5 shadow-md' : 'bg-card hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {todayLesson && <Badge className="text-[10px] h-4 bg-primary">Bugun</Badge>}
            <Badge variant={meta.variant} className="text-[10px] h-4 gap-1">
              <StatusIcon className="h-2.5 w-2.5" />
              {meta.label}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm mt-1.5 leading-tight">{lesson.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lesson.group?.course?.name} · {lesson.group?.name}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-primary">{fmtTime(lesson.lessonDate)}</p>
          <p className="text-[11px] text-muted-foreground">{fmtDay(lesson.lessonDate)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />{lesson.duration} daq
        </span>
        {lesson.teacher && (
          <span className="flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            {lesson.teacher.user?.firstName} {lesson.teacher.user?.lastName}
          </span>
        )}
      </div>

      {lesson.topic && (
        <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
          <span className="font-medium">Mavzu:</span> {lesson.topic}
        </div>
      )}
      {lesson.description && !lesson.topic && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
      )}

      {isTeacher && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t">
          {lesson.status === 'PLANNED' && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onMarkDone?.(lesson.id)}>
              <Check className="h-3 w-3" />O'tkazildi
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-auto"
            onClick={() => onEdit?.(lesson)}>
            <Pencil className="h-3 w-3" />Tahrirlash
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(lesson.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Create / Edit Dialog ──────────────────────────────────────────────────────

function LessonForm({
  groups, onClose, onSave, initial,
}: {
  groups: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: any;
}) {
  const [form, setForm] = useState({
    groupId:     initial?.groupId     ?? '',
    title:       initial?.title       ?? '',
    description: initial?.description ?? '',
    lessonDate:  initial?.lessonDate  ? initial.lessonDate.slice(0, 16) : '',
    duration:    initial?.duration    ?? 60,
    topic:       initial?.topic       ?? '',
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="font-bold text-lg">{initial ? 'Darsni tahrirlash' : 'Yangi dars qo\'shish'}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Group */}
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Guruh *</label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={form.groupId}
              onChange={e => set('groupId', e.target.value)}
            >
              <option value="">Guruhni tanlang</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.course?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Dars nomi *</label>
            <Input
              placeholder="Masalan: Present Simple kirish darsi"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Sana va vaqt *</label>
              <Input
                type="datetime-local"
                value={form.lessonDate}
                onChange={e => set('lessonDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Davomiyligi (daqiqa)</label>
              <Input
                type="number"
                min={15}
                max={240}
                value={form.duration}
                onChange={e => set('duration', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Dars mavzusi</label>
            <Input
              placeholder="Masalan: Present Simple — ta'rif va ishlatilishi"
              value={form.topic}
              onChange={e => set('topic', e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Izoh</label>
            <Textarea
              rows={2}
              placeholder="Qo'shimcha ma'lumot..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Bekor qilish</Button>
          <Button
            className="flex-1"
            disabled={!form.groupId || !form.title || !form.lessonDate}
            onClick={() => {
              const payload: any = {
                groupId:    form.groupId,
                title:      form.title,
                lessonDate: new Date(form.lessonDate).toISOString(),
                duration:   form.duration,
              };
              if (form.topic)       payload.topic       = form.topic;
              if (form.description) payload.description = form.description;
              onSave(payload);
            }}
          >
            {initial ? 'Saqlash' : "Qo'shish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'today' | 'upcoming' | 'past' | 'all';

export default function LessonsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isTeacher  = user?.role === 'TEACHER';
  const isStudent  = user?.role === 'STUDENT' || user?.role === 'PARENT';
  const isAdmin    = !isTeacher && !isStudent;

  const [tab, setTab]       = useState<Tab>('today');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]  = useState<any>(null);

  // ── data ──
  const { data: teacherLessons, isLoading: teacherLoading } = useQuery({
    queryKey: ['lessons', 'my'],
    queryFn: () => lessonsApi.getMyLessons(),
    enabled: isTeacher || isAdmin,
  });
  const { data: studentLessons, isLoading: studentLoading } = useQuery({
    queryKey: ['lessons', 'student'],
    queryFn: () => lessonsApi.getStudentLessons(),
    enabled: isStudent,
  });
  const { data: myGroupsData } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: isTeacher,
  });

  const isLoading = teacherLoading || studentLoading;

  const rawLessons: any[] = isStudent
    ? (studentLessons?.data?.data ?? [])
    : (teacherLessons?.data?.data ?? []);

  const myGroups: any[] = myGroupsData?.data?.data ?? [];

  // ── filter by tab ──
  const now = new Date();
  const todayLessons    = rawLessons.filter(l => isToday(parseISO(l.lessonDate)));
  const upcomingLessons = rawLessons.filter(l => isFuture(parseISO(l.lessonDate)) && !isToday(parseISO(l.lessonDate)));
  const pastLessons     = rawLessons.filter(l => isPast(parseISO(l.lessonDate)) && !isToday(parseISO(l.lessonDate)));

  const displayLessons = tab === 'today'    ? todayLessons
    : tab === 'upcoming' ? upcomingLessons
    : tab === 'past'     ? pastLessons
    : rawLessons;

  // ── mutations ──
  const createMutation = useMutation({
    mutationFn: (data: any) => lessonsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => lessonsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lessons'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => lessonsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  });

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'today',    label: 'Bugun',      count: todayLessons.length },
    { key: 'upcoming', label: 'Kelayotgan', count: upcomingLessons.length },
    { key: 'past',     label: "O'tgan",     count: pastLessons.length },
    { key: 'all',      label: 'Barchasi',   count: rawLessons.length },
  ];

  // next lesson for student
  const nextLesson = isStudent ? rawLessons.find(l => !isPast(parseISO(l.lessonDate)) || isToday(parseISO(l.lessonDate))) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Darslar
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isTeacher ? "O'qituvchi dars rejasi" : isStudent ? "Mening darslarim" : "Barcha darslar"}
          </p>
        </div>
        {isTeacher && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Dars qo'shish
          </Button>
        )}
      </div>

      {/* Student: Next lesson highlight */}
      {isStudent && nextLesson && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              Navbatdagi dars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-lg leading-tight">{nextLesson.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {nextLesson.group?.course?.name} · {nextLesson.group?.name}
                </p>
                {nextLesson.topic && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    <span className="font-medium">Mavzu:</span> {nextLesson.topic}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  O'qituvchi: {nextLesson.teacher?.user?.firstName} {nextLesson.teacher?.user?.lastName}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-bold text-primary">{fmtTime(nextLesson.lessonDate)}</p>
                <p className="text-xs text-muted-foreground">{fmtDay(nextLesson.lessonDate)}</p>
                <Badge variant="secondary" className="mt-1 gap-1 text-[10px]">
                  <Clock className="h-2.5 w-2.5" />{nextLesson.duration} daq
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row for teacher */}
      {isTeacher && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Jami darslar',        value: rawLessons.length,     color: 'text-primary' },
            { label: "O'tkazilgan",          value: rawLessons.filter(l => l.status === 'COMPLETED').length, color: 'text-green-600' },
            { label: 'Rejalashtirilgan',     value: rawLessons.filter(l => l.status === 'PLANNED').length, color: 'text-blue-600' },
          ].map(s => (
            <Card key={s.label} className="text-center py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === t.key
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 leading-none ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lessons list */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : displayLessons.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Darslar topilmadi</p>
            {isTeacher && tab !== 'past' && (
              <p className="text-xs text-muted-foreground mt-1">
                "Dars qo'shish" tugmasini bosing
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayLessons.map((lesson: any) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isTeacher={isTeacher}
              onEdit={setEditing}
              onDelete={id => {
                if (confirm('Darsni o\'chirishni tasdiqlaysizmi?')) {
                  deleteMutation.mutate(id);
                }
              }}
              onMarkDone={id =>
                updateMutation.mutate({ id, data: { status: 'COMPLETED' } })
              }
            />
          ))}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <LessonForm
          groups={myGroups}
          onClose={() => setShowForm(false)}
          onSave={data => createMutation.mutate(data)}
        />
      )}

      {/* Edit form modal */}
      {editing && (
        <LessonForm
          groups={myGroups}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={data => updateMutation.mutate({ id: editing.id, data })}
        />
      )}
    </div>
  );
}
