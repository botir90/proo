'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users2, MapPin, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, studentsApi } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { GroupForm } from '@/components/forms/group-form';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default', FINISHED: 'secondary', PAUSED: 'outline',
};
const statusLabel: Record<string, string> = { ACTIVE: 'Faol', FINISHED: 'Tugagan', PAUSED: "To'xtatilgan" };

// ─── O'quvchilar boshqaruv dialogi ───────────────────────────────────────────
function GroupStudentsDialog({ group, open, onClose }: { group: any; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 400);

  // Guruh a'zolari
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['group-students', group?.id],
    queryFn: () => groupsApi.getStudents(group.id),
    enabled: open && !!group?.id,
  });

  // Barcha o'quvchilar (qo'shish uchun)
  const { data: allStudentsData } = useQuery({
    queryKey: ['students', 'all', debouncedStudentSearch],
    queryFn: () => studentsApi.getAll({ limit: 100, search: debouncedStudentSearch }),
    enabled: open,
  });

  const members: any[] = membersData?.data?.data ?? [];
  const memberStudentIds = new Set(members.map((m: any) => m.studentId));

  const allStudents: any[] = (allStudentsData?.data?.data?.items ?? [])
    .filter((s: any) => !memberStudentIds.has(s.id));

  const addMutation = useMutation({
    mutationFn: (studentId: string) => groupsApi.addStudent(group.id, studentId),
    onSuccess: () => {
      toast({ title: "O'quvchi guruhga qo'shildi" });
      setSelectedStudentId('');
      queryClient.invalidateQueries({ queryKey: ['group-students', group.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const removeMutation = useMutation({
    mutationFn: (studentId: string) => groupsApi.removeStudent(group.id, studentId),
    onSuccess: () => {
      toast({ title: "O'quvchi guruhdan chiqarildi" });
      queryClient.invalidateQueries({ queryKey: ['group-students', group.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            {group.name} — O'quvchilar
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {members.length} / {group.maxStudents} ta o'quvchi
          </p>
        </DialogHeader>

        {/* O'quvchi qo'shish */}
        <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
          <p className="text-sm font-medium">O'quvchi qo'shish</p>
          <div className="space-y-2">
            <Input
              placeholder="Ism yoki email bo'yicha qidirish..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="O'quvchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {allStudents.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      {debouncedStudentSearch ? "Topilmadi" : "Barcha o'quvchilar guruhda"}
                    </div>
                  ) : (
                    allStudents.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user?.firstName} {s.user?.lastName}
                        {s.user?.phone && <span className="text-muted-foreground ml-1 text-xs">({s.user.phone})</span>}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!selectedStudentId || addMutation.isPending || members.length >= group.maxStudents}
                onClick={() => addMutation.mutate(selectedStudentId)}
                className="shrink-0"
              >
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                <span className="ml-1.5">Qo'shish</span>
              </Button>
            </div>
            {members.length >= group.maxStudents && (
              <p className="text-xs text-destructive">Guruh to'lgan ({group.maxStudents} ta limit)</p>
            )}
          </div>
        </div>

        {/* Joriy a'zolar ro'yxati */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {membersLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users2 className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">Guruhda hali o'quvchi yo'q</p>
            </div>
          ) : (
            members.map((member: any, idx: number) => {
              const s = member.student;
              const name = `${s?.user?.firstName ?? ''} ${s?.user?.lastName ?? ''}`.trim();
              return (
                <div key={member.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(s?.user?.firstName, s?.user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{name || 'Noma\'lum'}</p>
                      <p className="text-xs text-muted-foreground">{s?.user?.phone || s?.user?.email || ''}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(member.studentId)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Asosiy sahifa ─────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [studentsGroup, setStudentsGroup] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: myGroupsData, isLoading: myLoading } = useQuery({
    queryKey: ['groups', 'my-groups'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: isTeacher,
  });

  const { data: allGroupsData, isLoading: allLoading } = useQuery({
    queryKey: ['groups', page, debouncedSearch],
    queryFn: () => groupsApi.getAll({ page, limit: 10, search: debouncedSearch }),
    enabled: !isTeacher,
  });

  const isLoading = isTeacher ? myLoading : allLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Guruh o\'chirildi' });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const groups = isTeacher
    ? (myGroupsData?.data?.data ?? [])
    : (allGroupsData?.data?.data?.items ?? []);
  const meta = isTeacher ? null : allGroupsData?.data?.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isTeacher ? 'Mening guruhlarim' : 'Guruhlar'}</h1>
          <p className="text-muted-foreground">
            {isTeacher ? `${groups.length} ta guruh` : `Jami: ${meta?.total || 0} ta guruh`}
          </p>
        </div>
        {!isTeacher && (
          <Button onClick={() => { setSelected(null); setOpenForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Guruh yaratish
          </Button>
        )}
      </div>

      {!isTeacher && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Guruh nomini qidiring..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guruh</TableHead>
                <TableHead>Kurs</TableHead>
                {!isTeacher && <TableHead>O'qituvchi</TableHead>}
                <TableHead>Jadval</TableHead>
                <TableHead>Xona</TableHead>
                <TableHead>O'quvchilar</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <Users2 className="mx-auto h-10 w-10 mb-2 opacity-20" />
                    {isTeacher ? "Sizga biriktirilgan guruh yo'q" : 'Guruhlar topilmadi'}
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group: any) => (
                  <TableRow key={group.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: group.course?.color || '#6366f1' }} />
                        <span className="font-medium text-sm">{group.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{group.course?.name}</Badge>
                    </TableCell>
                    {!isTeacher && (
                      <TableCell className="text-sm">
                        {group.teacher?.user?.firstName} {group.teacher?.user?.lastName}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {group.schedule || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />{group.room || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{group._count?.members || 0}</span>
                        <span className="text-muted-foreground text-xs">/ {group.maxStudents}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[group.status]} className="text-xs">
                        {statusLabel[group.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* O'quvchilarni boshqarish — admin/manager/teacher */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          title="O'quvchilarni boshqarish"
                          onClick={() => setStudentsGroup(group)}
                        >
                          <Users2 className="h-3.5 w-3.5" />
                        </Button>
                        {/* Tahrirlash/o'chirish — faqat admin/manager */}
                        {!isTeacher && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { setSelected(group); setOpenForm(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(group.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)} / {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}>Oldingi</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      )}

      {/* Guruh yaratish/tahrirlash dialogi */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Guruhni tahrirlash' : 'Yangi guruh yaratish'}</DialogTitle>
          </DialogHeader>
          <GroupForm
            group={selected}
            onSuccess={() => { setOpenForm(false); queryClient.invalidateQueries({ queryKey: ['groups'] }); }}
          />
        </DialogContent>
      </Dialog>

      {/* O'quvchilar boshqaruv dialogi */}
      <GroupStudentsDialog
        group={studentsGroup}
        open={!!studentsGroup}
        onClose={() => setStudentsGroup(null)}
      />

      {/* O'chirish tasdiqlash */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guruhni o'chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>Bu amal qaytarib bo'lmaydi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
