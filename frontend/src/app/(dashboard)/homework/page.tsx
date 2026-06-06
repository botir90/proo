'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Trash2, CheckCircle2, Clock,
  Loader2, CalendarDays, Star, Users, Trophy,
  Paperclip, Download, FileText, X, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { homeworkApi, groupsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, getInitials } from '@/lib/utils';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');

function fileUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${API_BASE}/${path}`;
}

function FileChip({ path, label }: { path: string | null | undefined; label?: string }) {
  const url = fileUrl(path);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors max-w-[180px] truncate">
      <FileText className="w-3 h-3 shrink-0" />
      <span className="truncate">{label || 'Fayl'}</span>
      <Download className="w-3 h-3 shrink-0" />
    </a>
  );
}

function FilePicker({ value, onChange, label }: { value: File | null; onChange: (f: File | null) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm transition-colors hover:bg-muted/50"
          style={{ borderColor: value ? 'rgb(59,130,246)' : undefined }}>
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">
            {value ? value.name : 'Fayl biriktirish (rasm, PDF, doc)'}
          </span>
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input ref={ref} type="file" className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        onChange={e => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

export default function HomeworkPage() {
  const { user } = useAuthStore();
  const isTeacher = ['TEACHER', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');
  const isStudent = user?.role === 'STUDENT';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Teacher create state
  const [openForm, setOpenForm]         = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [dueDate, setDueDate]           = useState('');
  const [createFile, setCreateFile]     = useState<File | null>(null);
  const [viewGroup, setViewGroup]       = useState('');

  // Teacher submissions state
  const [submissionsHW, setSubmissionsHW] = useState<any>(null);
  const [pointsMap, setPointsMap]         = useState<Record<string, string>>({});

  // Student submit dialog
  const [submitHW, setSubmitHW]   = useState<any>(null);
  const [submitNote, setSubmitNote] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);

  const { data: myGroupsData } = useQuery({
    queryKey: ['groups', 'my-groups'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: isTeacher && user?.role === 'TEACHER',
  });

  const { data: allGroupsData } = useQuery({
    queryKey: ['groups', 'all-list'],
    queryFn: () => groupsApi.getAll({ limit: 100 }),
    enabled: isTeacher && user?.role !== 'TEACHER',
  });

  const { data: groupHWData, isLoading: groupHWLoading } = useQuery({
    queryKey: ['homework', 'group', viewGroup],
    queryFn: () => homeworkApi.getByGroup(viewGroup),
    enabled: !!viewGroup && !isStudent,
  });

  const { data: myHWData, isLoading: myHWLoading } = useQuery({
    queryKey: ['homework', 'my'],
    queryFn: () => homeworkApi.getMyHomeworks(),
    enabled: isStudent,
  });

  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ['homework', 'submissions', submissionsHW?.id],
    queryFn: () => homeworkApi.getSubmissions(submissionsHW.id),
    enabled: !!submissionsHW?.id,
  });

  const groups        = user?.role === 'TEACHER' ? (myGroupsData?.data?.data ?? []) : (allGroupsData?.data?.data?.items ?? []);
  const groupHomeworks: any[] = groupHWData?.data?.data ?? [];
  const myHomeworks: any[]    = myHWData?.data?.data ?? [];
  const submissions: any[]    = submissionsData?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => homeworkApi.create({ groupId: selectedGroup, title, description, dueDate: dueDate || undefined }, createFile),
    onSuccess: () => {
      toast({ title: 'Vazifa yaratildi' });
      queryClient.invalidateQueries({ queryKey: ['homework', 'group', selectedGroup] });
      setOpenForm(false);
      setTitle(''); setDescription(''); setDueDate(''); setCreateFile(null);
      if (!viewGroup) setViewGroup(selectedGroup);
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => homeworkApi.delete(id),
    onSuccess: () => { toast({ title: "Vazifa o'chirildi" }); queryClient.invalidateQueries({ queryKey: ['homework'] }); },
  });

  const submitMutation = useMutation({
    mutationFn: () => homeworkApi.submit(submitHW.id, submitNote || undefined, submitFile),
    onSuccess: () => {
      toast({ title: 'Vazifa topshirildi ✓' });
      queryClient.invalidateQueries({ queryKey: ['homework', 'my'] });
      setSubmitHW(null); setSubmitNote(''); setSubmitFile(null);
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, points }: { submissionId: string; points: number }) =>
      homeworkApi.grade(submissionId, points),
    onSuccess: (_, { submissionId }) => {
      toast({ title: 'Ball berildi ⭐', description: `${pointsMap[submissionId]} ball` });
      queryClient.invalidateQueries({ queryKey: ['homework', 'submissions', submissionsHW?.id] });
      queryClient.invalidateQueries({ queryKey: ['students-rating'] });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  // ─── STUDENT VIEW ──────────────────────────────────────────────
  if (isStudent) {
    const pending = myHomeworks.filter(h => !h.submissions?.[0]?.isDone);
    const done    = myHomeworks.filter(h =>  h.submissions?.[0]?.isDone);

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Vazifalarim</h1>
          <p className="text-muted-foreground">O'qituvchi bergan uy vazifalari</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
              <p className="text-xs text-yellow-600">Bajarilmagan</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-700">{done.length}</p>
              <p className="text-xs text-green-600">Bajarilgan</p>
            </CardContent>
          </Card>
        </div>

        {myHWLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : myHomeworks.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="mx-auto h-10 w-10 mb-2 opacity-20" />
            <p>Hozircha vazifa yo'q</p>
          </CardContent></Card>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="grid grid-cols-2 max-w-xs">
              <TabsTrigger value="pending">Bajarilmagan ({pending.length})</TabsTrigger>
              <TabsTrigger value="done">Bajarilgan ({done.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4 space-y-3">
              {pending.map((hw: any) => (
                <Card key={hw.id} className="border-l-4" style={{ borderLeftColor: hw.group?.course?.color ?? '#6366f1' }}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{hw.title}</p>
                        <p className="text-sm text-muted-foreground">{hw.group?.name} • {hw.group?.course?.name}</p>
                        {hw.description && <p className="text-sm mt-1 text-muted-foreground">{hw.description}</p>}
                        {hw.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Muddat: {formatDate(hw.dueDate)}
                          </p>
                        )}
                        {hw.fileUrl && (
                          <div className="mt-2">
                            <FileChip path={hw.fileUrl} label="O'qituvchi fayli" />
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 gap-1.5"
                        onClick={() => { setSubmitHW(hw); setSubmitNote(''); setSubmitFile(null); }}>
                        <Upload className="h-3.5 w-3.5" /> Topshirish
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="done" className="mt-4 space-y-3">
              {done.map((hw: any) => {
                const sub = hw.submissions?.[0];
                return (
                  <Card key={hw.id} className="border-l-4 border-l-green-400">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{hw.title}</p>
                          <p className="text-xs text-muted-foreground">{hw.group?.course?.name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {hw.fileUrl && <FileChip path={hw.fileUrl} label="Ustoz fayli" />}
                            {sub?.fileUrl && <FileChip path={sub.fileUrl} label="Mening faylim" />}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {sub?.points != null && (
                            <Badge className="bg-yellow-500 text-white gap-1">
                              <Star className="w-3 h-3" /> {sub.points} ball
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Bajarildi
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        )}

        {/* Student submit dialog */}
        <Dialog open={!!submitHW} onOpenChange={v => !v && setSubmitHW(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Vazifani topshirish
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm font-medium text-muted-foreground">{submitHW?.title}</p>

              <div className="space-y-1.5">
                <Label className="text-xs">Izoh (ixtiyoriy)</Label>
                <Input placeholder="Qo'shimcha izoh..." value={submitNote}
                  onChange={e => setSubmitNote(e.target.value)} />
              </div>

              <FilePicker value={submitFile} onChange={setSubmitFile} label="Fayl biriktirish (ixtiyoriy)" />

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setSubmitHW(null)}>Bekor</Button>
                <Button className="flex-1 gap-1.5" disabled={submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}>
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Topshirish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── TEACHER / ADMIN VIEW ──────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vazifalar</h1>
          <p className="text-muted-foreground">Uy vazifalarini boshqarish</p>
        </div>
        <Button onClick={() => setOpenForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Vazifa berish
        </Button>
      </div>

      <div className="max-w-xs">
        <Select value={viewGroup} onValueChange={setViewGroup}>
          <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
          <SelectContent>
            {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!viewGroup ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-20" />
          <p>Vazifalarni ko'rish uchun guruhni tanlang</p>
        </div>
      ) : groupHWLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : groupHomeworks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><p>Bu guruhda vazifa yo'q</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {groupHomeworks.map((hw: any) => (
            <Card key={hw.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{hw.title}</p>
                      <Badge variant="outline" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {hw._count?.submissions ?? 0} bajarildi
                      </Badge>
                    </div>
                    {hw.description && <p className="text-sm text-muted-foreground mt-1">{hw.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(hw.createdAt)}</span>
                      {hw.dueDate && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Muddat: {formatDate(hw.dueDate)}</span>}
                    </div>
                    {hw.fileUrl && (
                      <div className="mt-2">
                        <FileChip path={hw.fileUrl} label="Biriktirilgan fayl" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50"
                      onClick={() => { setSubmissionsHW(hw); setPointsMap({}); }}>
                      <Users className="h-3.5 w-3.5" /> Ball berish
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(hw.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submissions & grading dialog */}
      <Dialog open={!!submissionsHW} onOpenChange={v => !v && setSubmissionsHW(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {submissionsHW?.title} — topshiriqlar
            </DialogTitle>
          </DialogHeader>

          {submissionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p>Hali hech kim topshirmagan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: any) => {
                const currentPts   = pointsMap[sub.id] ?? (sub.points?.toString() ?? '');
                const alreadyGraded = sub.points != null;
                return (
                  <div key={sub.id} className={`rounded-xl border p-3 ${alreadyGraded ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200' : 'bg-muted/30'}`}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="text-xs font-bold bg-violet-100 text-violet-700">
                          {getInitials(sub.student?.user?.firstName, sub.student?.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {sub.student?.user?.firstName} {sub.student?.user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {sub.doneAt ? formatDate(sub.doneAt) : 'Bajarildi'}
                          {alreadyGraded && (
                            <span className="ml-1 text-yellow-600 font-medium flex items-center gap-0.5">
                              <Star className="w-3 h-3" /> {sub.points} ball
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input type="number" min={1} max={100} placeholder="Ball" value={currentPts}
                          onChange={e => setPointsMap(p => ({ ...p, [sub.id]: e.target.value }))}
                          className="w-20 h-8 text-sm text-center" />
                        <Button size="sm" className="h-8 gap-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                          disabled={!currentPts || isNaN(Number(currentPts)) || gradeMutation.isPending}
                          onClick={() => gradeMutation.mutate({ submissionId: sub.id, points: Number(currentPts) })}>
                          <Star className="w-3 h-3" />
                          {alreadyGraded ? 'Yangilash' : 'Berish'}
                        </Button>
                      </div>
                    </div>
                    {/* Student's submitted file */}
                    {sub.fileUrl && (
                      <div className="mt-2 pl-12">
                        <FileChip path={sub.fileUrl} label="O'quvchi fayli" />
                      </div>
                    )}
                    {sub.note && (
                      <p className="text-xs text-muted-foreground mt-1.5 pl-12 italic">"{sub.note}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create homework dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Yangi vazifa berish</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Guruh *</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
                <SelectContent>
                  {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vazifa nomi *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: Unit 5 exercises" />
            </div>
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Qo'shimcha ma'lumot..." />
            </div>
            <div className="space-y-1.5">
              <Label>Muddat (ixtiyoriy)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <FilePicker value={createFile} onChange={setCreateFile} label="Fayl biriktirish (ixtiyoriy)" />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpenForm(false)}>Bekor</Button>
              <Button className="flex-1" disabled={!selectedGroup || !title.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yuborish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
