'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video, Plus, Clock, CalendarDays, BookOpen, CheckCircle2, XCircle,
  ChevronRight, Users2, Pencil, Trash2, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth.store';
import { lessonsApi, groupsApi } from '@/lib/api';
import { format, isToday, isFuture, isPast, parseISO } from 'date-fns';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDay(d: string) {
  try { return format(parseISO(d), 'dd.MM.yyyy'); } catch { return d; }
}
function fmtTime(d: string) {
  try { return format(parseISO(d), 'HH:mm'); } catch { return d; }
}

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  PLANNED:   { label: 'Rejalashtirilgan', variant: 'secondary',   icon: CalendarDays },
  COMPLETED: { label: "O'tilgan",         variant: 'default',     icon: CheckCircle2 },
  CANCELLED: { label: 'Bekor qilingan',   variant: 'destructive', icon: XCircle },
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
            <Button size="sm" variant="outline"
              className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onMarkDone?.(lesson.id)}>
              <Check className="h-3 w-3" />O'tkazildi
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-auto"
            onClick={() => onEdit?.(lesson)}>
            <Pencil className="h-3 w-3" />Tahrirlash
          </Button>
          <Button size="sm" variant="ghost"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(lesson.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Lesson Form Dialog ────────────────────────────────────────────────────────

function LessonFormDialog({
  open, onOpenChange, groups, onSave, initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: any[];
  onSave: (data: any) => void;
  initial?: any;
}) {
  const [groupId,     setGroupId]     = useState(initial?.groupId     ?? '');
  const [title,       setTitle]       = useState(initial?.title       ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [lessonDate,  setLessonDate]  = useState(
    initial?.lessonDate ? initial.lessonDate.slice(0, 16) : '',
  );
  const [duration,    setDuration]    = useState<number>(initial?.duration ?? 60);
  const [topic,       setTopic]       = useState(initial?.topic ?? '');

  const canSave = groupId && title && lessonDate;

  function handleSave() {
    const payload: any = {
      groupId,
      title,
      lessonDate: new Date(lessonDate).toISOString(),
      duration,
    };
    if (topic)       payload.topic       = topic;
    if (description) payload.description = description;
    onSave(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Darsni tahrirlash' : "Yangi dars qo'shish"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Group */}
          <div className="space-y-1.5">
            <Label>Guruh *</Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
            >
              <option value="">Guruhni tanlang</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name}{g.course?.name ? ` — ${g.course.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Dars nomi *</Label>
            <Input
              placeholder="Masalan: Present Simple kirish darsi"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sana va vaqt *</Label>
              <Input
                type="datetime-local"
                value={lessonDate}
                onChange={e => setLessonDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Davomiyligi (daqiqa)</Label>
              <Input
                type="number"
                min={15}
                max={240}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <Label>Dars mavzusi</Label>
            <Input
              placeholder="Masalan: Present Simple — ta'rif va ishlatilishi"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Izoh</Label>
            <Textarea
              rows={2}
              placeholder="Qo'shimcha ma'lumot..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button className="flex-1" disabled={!canSave} onClick={handleSave}>
              {initial ? 'Saqlash' : "Qo'shish"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'today' | 'upcoming' | 'past' | 'all';

export default function LessonsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT' || user?.role === 'PARENT';
  const isAdmin   = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role ?? '');
  const canCreate = isTeacher || isAdmin;

  const [tab, setTab]           = useState<Tab>('today');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<any>(null);

  // ── data ──
  const { data: teacherLessons, isLoading: teacherLoading } = useQuery({
    queryKey: ['lessons', 'my'],
    queryFn:  () => lessonsApi.getMyLessons(),
    enabled:  isTeacher,
  });
  const { data: adminLessons, isLoading: adminLoading } = useQuery({
    queryKey: ['lessons', 'all'],
    queryFn:  () => lessonsApi.getAllLessons(),
    enabled:  isAdmin,
  });
  const { data: studentLessons, isLoading: studentLoading } = useQuery({
    queryKey: ['lessons', 'student'],
    queryFn:  () => lessonsApi.getStudentLessons(),
    enabled:  isStudent,
  });

  // Groups for the create form
  const { data: teacherGroupsData } = useQuery({
    queryKey: ['groups', 'teacher-list'],
    queryFn:  () => groupsApi.getMyGroups(),
    enabled:  isTeacher,
  });
  const { data: allGroupsData } = useQuery({
    queryKey: ['groups', 'all-for-lessons'],
    queryFn:  () => groupsApi.getAll({ limit: 200 }),
    enabled:  isAdmin,
  });

  const isLoading = teacherLoading || studentLoading || adminLoading;

  const rawLessons: any[] = isStudent
    ? (studentLessons?.data?.data ?? [])
    : isAdmin
    ? (adminLessons?.data?.data ?? [])
    : (teacherLessons?.data?.data ?? []);

  const myGroups: any[] = isAdmin
    ? (allGroupsData?.data?.data?.items ?? [])
    : (teacherGroupsData?.data?.data ?? []);

  // ── tabs ──
  const todayLessons    = rawLessons.filter(l => isToday(parseISO(l.lessonDate)));
  const upcomingLessons = rawLessons.filter(l => isFuture(parseISO(l.lessonDate)) && !isToday(parseISO(l.lessonDate)));
  const pastLessons     = rawLessons.filter(l => isPast(parseISO(l.lessonDate))  && !isToday(parseISO(l.lessonDate)));

  const displayLessons =
    tab === 'today'    ? todayLessons    :
    tab === 'upcoming' ? upcomingLessons :
    tab === 'past'     ? pastLessons     :
    rawLessons;

  // ── mutations ──
  const createMutation = useMutation({
    mutationFn: (data: any) => lessonsApi.create(data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => lessonsApi.update(id, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['lessons'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => lessonsApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  });

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'today',    label: 'Bugun',      count: todayLessons.length    },
    { key: 'upcoming', label: 'Kelayotgan', count: upcomingLessons.length },
    { key: 'past',     label: "O'tgan",     count: pastLessons.length     },
    { key: 'all',      label: 'Barchasi',   count: rawLessons.length      },
  ];

  // next lesson for student
  const nextLesson = isStudent
    ? rawLessons.find(l => !isPast(parseISO(l.lessonDate)) || isToday(parseISO(l.lessonDate)))
    : null;

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
            {isAdmin ? 'Barcha darslar' : isTeacher ? "O'qituvchi dars rejasi" : 'Mening darslarim'}
          </p>
        </div>
        {canCreate && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Dars qo'shish
          </Button>
        )}
      </div>

      {/* Student: next lesson highlight */}
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

      {/* Teacher stats */}
      {canCreate && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Jami darslar',      value: rawLessons.length,                                          color: 'text-primary'    },
            { label: "O'tkazilgan",        value: rawLessons.filter(l => l.status === 'COMPLETED').length,    color: 'text-green-600'  },
            { label: 'Rejalashtirilgan',   value: rawLessons.filter(l => l.status === 'PLANNED').length,      color: 'text-blue-600'   },
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
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : displayLessons.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Darslar topilmadi</p>
            {canCreate && tab !== 'past' && (
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
              isTeacher={canCreate}
              onEdit={setEditing}
              onDelete={id => {
                if (confirm("Darsni o'chirishni tasdiqlaysizmi?")) {
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

      {/* Create dialog */}
      <LessonFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        groups={myGroups}
        onSave={data => createMutation.mutate(data)}
      />

      {/* Edit dialog */}
      <LessonFormDialog
        open={!!editing}
        onOpenChange={v => { if (!v) setEditing(null); }}
        groups={myGroups}
        initial={editing}
        onSave={data => updateMutation.mutate({ id: editing.id, data })}
      />
    </div>
  );
}
