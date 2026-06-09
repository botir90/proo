'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Star, School, Eye, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { teachersApi, expensesApi } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { getInitials, getAvatarUrl, formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { TeacherForm } from '@/components/forms/teacher-form';

export default function TeachersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [salaryTeacher, setSalaryTeacher] = useState<any>(null);
  const [salaryAmount, setSalaryAmount] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', page, debouncedSearch],
    queryFn: () => teachersApi.getAll({ page, limit: 10, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: "O'qituvchi o'chirildi" });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const salaryMutation = useMutation({
    mutationFn: (data: { title: string; amount: number; description: string }) =>
      expensesApi.create({ ...data, category: 'Maosh' }),
    onSuccess: () => {
      toast({ title: "Maosh to'landi", description: `${salaryTeacher?.user?.firstName} ${salaryTeacher?.user?.lastName}ga maosh xarajatlarga yozildi` });
      setSalaryTeacher(null);
      setSalaryAmount('');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  function openSalaryDialog(teacher: any) {
    setSalaryTeacher(teacher);
    setSalaryAmount(String(Number(teacher.salary) || 0));
  }

  function handlePaySalary() {
    if (!salaryTeacher || !salaryAmount) return;
    const name = `${salaryTeacher.user?.firstName} ${salaryTeacher.user?.lastName}`;
    salaryMutation.mutate({
      title: `${name} — maosh`,
      amount: Number(salaryAmount),
      description: `O'qituvchi maoshi. ${new Date().toLocaleDateString('uz-UZ')}`,
    });
  }

  const teachers = data?.data?.data?.items || [];
  const meta = data?.data?.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">O'qituvchilar</h1>
          <p className="text-muted-foreground">Jami: {meta?.total || 0} ta o'qituvchi</p>
        </div>
        <Button onClick={() => { setSelected(null); setOpenForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Qo'shish
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Ism yoki email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>O'qituvchi</TableHead>
                <TableHead>Fanlar</TableHead>
                <TableHead>Maosh</TableHead>
                <TableHead>Tajriba</TableHead>
                <TableHead>Guruhlar</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-20" /></TableCell>)}</TableRow>
                ))
              ) : teachers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground"><School className="mx-auto h-10 w-10 mb-2 opacity-20" />O'qituvchilar topilmadi</TableCell></TableRow>
              ) : (
                teachers.map((teacher: any) => (
                  <TableRow key={teacher.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={getAvatarUrl(teacher.user?.avatar)} />
                          <AvatarFallback className="bg-blue-500 text-white text-xs">
                            {getInitials(teacher.user?.firstName, teacher.user?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{teacher.user?.firstName} {teacher.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{teacher.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects?.slice(0, 2).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {teacher.subjects?.length > 2 && <Badge variant="outline" className="text-xs">+{teacher.subjects.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(teacher.salary))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {teacher.experience} yil
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{teacher._count?.groups || 0} ta</Badge></TableCell>
                    <TableCell>
                      <Badge variant={teacher.user?.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                        {teacher.user?.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => router.push(`/teachers/${teacher.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Maosh to'lash" onClick={() => openSalaryDialog(teacher)}>
                          <Wallet className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(teacher); setOpenForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(teacher.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
          <p className="text-sm text-muted-foreground">{(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)} / {meta.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}>Oldingi</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}</DialogTitle></DialogHeader>
          <TeacherForm teacher={selected} onSuccess={() => { setOpenForm(false); queryClient.invalidateQueries({ queryKey: ['teachers'] }); }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>O'qituvchi ma'lumotlari butunlay o'chib ketadi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>O'chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Salary payment dialog */}
      <Dialog open={!!salaryTeacher} onOpenChange={v => { if (!v) { setSalaryTeacher(null); setSalaryAmount(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Maosh to'lash
            </DialogTitle>
          </DialogHeader>
          {salaryTeacher && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">{salaryTeacher.user?.firstName} {salaryTeacher.user?.lastName}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {salaryTeacher.subjects?.join(', ')} · {salaryTeacher.experience} yil tajriba
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Maosh miqdori (so'm)</Label>
                <Input
                  type="number"
                  value={salaryAmount}
                  onChange={e => setSalaryAmount(e.target.value)}
                  placeholder="Miqdorni kiriting"
                />
                <p className="text-xs text-muted-foreground">
                  Belgilangan maosh: {Number(salaryTeacher.salary).toLocaleString()} so'm
                </p>
              </div>
              <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 rounded p-2">
                To'landi deb belgilanadi va xarajatlar bo'limiga avtomatik yoziladi.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setSalaryTeacher(null); setSalaryAmount(''); }}>
                  Bekor qilish
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!salaryAmount || Number(salaryAmount) <= 0 || salaryMutation.isPending}
                  onClick={handlePaySalary}
                >
                  {salaryMutation.isPending ? 'Saqlanmoqda...' : "To'landi ✓"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
