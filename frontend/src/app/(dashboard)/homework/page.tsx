'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Trash2, CheckCircle2, Clock, Loader2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { homeworkApi, groupsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';

export default function HomeworkPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [openForm, setOpenForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [viewGroup, setViewGroup] = useState('');

  // Teacher: o'z guruhlari
  const { data: myGroupsData } = useQuery({
    queryKey: ['groups', 'my-groups'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: isTeacher,
  });

  // Admin: barcha guruhlar
  const { data: allGroupsData } = useQuery({
    queryKey: ['groups', 'all-list'],
    queryFn: () => groupsApi.getAll({ limit: 100 }),
    enabled: !isTeacher && !isStudent,
  });

  // Tanlangan guruh vazifalari (teacher/admin)
  const { data: groupHWData, isLoading: groupHWLoading } = useQuery({
    queryKey: ['homework', 'group', viewGroup],
    queryFn: () => homeworkApi.getByGroup(viewGroup),
    enabled: !!viewGroup && !isStudent,
  });

  // Student: o'z vazifalari
  const { data: myHWData, isLoading: myHWLoading } = useQuery({
    queryKey: ['homework', 'my'],
    queryFn: () => homeworkApi.getMyHomeworks(),
    enabled: isStudent,
  });

  const groups = isTeacher
    ? (myGroupsData?.data?.data ?? [])
    : (allGroupsData?.data?.data?.items ?? []);

  const groupHomeworks: any[] = groupHWData?.data?.data ?? [];
  const myHomeworks: any[] = myHWData?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => homeworkApi.create({ groupId: selectedGroup, title, description, dueDate: dueDate || undefined }),
    onSuccess: () => {
      toast({ title: 'Vazifa yaratildi' });
      queryClient.invalidateQueries({ queryKey: ['homework', 'group', selectedGroup] });
      setOpenForm(false);
      setTitle(''); setDescription(''); setDueDate('');
      if (!viewGroup) setViewGroup(selectedGroup);
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => homeworkApi.delete(id),
    onSuccess: () => {
      toast({ title: "Vazifa o'chirildi" });
      queryClient.invalidateQueries({ queryKey: ['homework'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => homeworkApi.submit(id),
    onSuccess: () => {
      toast({ title: 'Vazifa bajarildi ✓' });
      queryClient.invalidateQueries({ queryKey: ['homework', 'my'] });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  // ─── STUDENT VIEW ────────────────────────────────────────────────────────────
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
          <Card><CardContent className="py-12 text-center text-muted-foreground"><BookOpen className="mx-auto h-10 w-10 mb-2 opacity-20" /><p>Hozircha vazifa yo'q</p></CardContent></Card>
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
                      <div className="min-w-0">
                        <p className="font-semibold">{hw.title}</p>
                        <p className="text-sm text-muted-foreground">{hw.group?.name} • {hw.group?.course?.name}</p>
                        {hw.description && <p className="text-sm mt-1">{hw.description}</p>}
                        {hw.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Muddat: {formatDate(hw.dueDate)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5"
                        disabled={submitMutation.isPending}
                        onClick={() => submitMutation.mutate(hw.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Bajardim
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="done" className="mt-4 space-y-3">
              {done.map((hw: any) => (
                <Card key={hw.id} className="opacity-60">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium line-through">{hw.title}</p>
                      <p className="text-xs text-muted-foreground">{hw.group?.course?.name}</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Bajarildi
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  }

  // ─── TEACHER / ADMIN VIEW ─────────────────────────────────────────────────────
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

      {/* Guruh tanlash */}
      <div className="max-w-xs">
        <Select value={viewGroup} onValueChange={setViewGroup}>
          <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
          <SelectContent>
            {groups.map((g: any) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
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
            <Card key={hw.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{hw.title}</p>
                      <Badge variant="outline" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {hw._count?.submissions ?? 0} bajarildi
                      </Badge>
                    </div>
                    {hw.description && <p className="text-sm text-muted-foreground mt-1">{hw.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(hw.createdAt)}</span>
                      {hw.dueDate && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Muddat: {formatDate(hw.dueDate)}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    onClick={() => deleteMutation.mutate(hw.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vazifa yaratish dialogi */}
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
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpenForm(false)}>Bekor</Button>
              <Button
                className="flex-1"
                disabled={!selectedGroup || !title.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yuborish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
