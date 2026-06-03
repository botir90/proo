'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Eye, Phone, MapPin, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { studentsApi } from '@/lib/api';
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils';
import { Student } from '@/types';
import { StudentForm } from '@/components/forms/student-form';
import { useDebounce } from '@/hooks/use-debounce';

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, debouncedSearch],
    queryFn: () => studentsApi.getAll({ page, limit: 10, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: "O'quvchi o'chirildi" });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: 'Xato', description: error.response?.data?.message, variant: 'destructive' });
    },
  });

  const students = data?.data?.data?.items || [];
  const meta = data?.data?.data?.meta;

  const genderLabel = (g?: string) => g === 'MALE' ? 'Erkak' : g === 'FEMALE' ? 'Ayol' : '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">O'quvchilar</h1>
          <p className="text-muted-foreground">Jami: {meta?.total || 0} ta o'quvchi</p>
        </div>
        <Button onClick={() => { setSelectedStudent(null); setOpenForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Qo'shish
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ism, email yoki telefon..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>O'quvchi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Jinsi</TableHead>
                <TableHead>Manzil</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead>Qo'shildi</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <UserRound className="mx-auto h-10 w-10 mb-2 opacity-20" />
                    O'quvchilar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: any) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={getAvatarUrl(student.user?.avatar)} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(student.user?.firstName, student.user?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.user?.firstName} {student.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{student.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {student.user?.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{genderLabel(student.gender)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm max-w-[150px] truncate">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        {student.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.user?.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                        {student.user?.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(student.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setSelectedStudent(student); setOpenForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(student.id)}>
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

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)} / {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Oldingi
            </Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Keyingi
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}</DialogTitle>
            <DialogDescription>Barcha majburiy maydonlarni to'ldiring</DialogDescription>
          </DialogHeader>
          <StudentForm
            student={selectedStudent}
            onSuccess={() => {
              setOpenForm(false);
              queryClient.invalidateQueries({ queryKey: ['students'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>Bu amalni qaytarib bo'lmaydi. O'quvchi ma'lumotlari butunlay o'chib ketadi.</AlertDialogDescription>
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
