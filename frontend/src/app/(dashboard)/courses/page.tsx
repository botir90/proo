'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, BookOpen, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { coursesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CourseForm } from '@/components/forms/course-form';
import { useAuthStore } from '@/stores/auth.store';

export default function CoursesPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, debouncedSearch],
    queryFn: () => coursesApi.getAll({ page, limit: 12, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); toast({ title: 'Kurs o\'chirildi' }); setDeleteId(null); },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const courses = data?.data?.data?.items || [];
  const meta = data?.data?.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kurslar</h1>
          <p className="text-muted-foreground">Jami: {meta?.total || 0} ta kurs</p>
        </div>
        {!isTeacher && (
          <Button onClick={() => { setSelected(null); setOpenForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Qo'shish
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Kurs nomini qidiring..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i} className="animate-pulse"><CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader><CardContent><div className="h-4 bg-muted rounded w-full" /></CardContent></Card>)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-20" />
          <p>Kurslar topilmadi</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <Card key={course.id} className="group hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: course.color || '#6366f1' }} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{course.name}</CardTitle>
                  <Badge variant={course.isActive ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                    {course.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
                {course.description && <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>}
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatCurrency(Number(course.price))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {course.duration} oy
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course._count?.groups || 0} ta guruh
                  </div>
                </div>
              </CardContent>
              {!isTeacher && (
                <CardFooter className="pt-0 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelected(course); setOpenForm(true); }}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Tahrirlash
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(course.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected ? 'Kursni tahrirlash' : 'Yangi kurs'}</DialogTitle></DialogHeader>
          <CourseForm course={selected} onSuccess={() => { setOpenForm(false); queryClient.invalidateQueries({ queryKey: ['courses'] }); }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kursni o'chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>Bu amal qaytarib bo'lmaydi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>O'chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
