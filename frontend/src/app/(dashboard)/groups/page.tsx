'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users2, Calendar, MapPin, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { groupsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { GroupForm } from '@/components/forms/group-form';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default', FINISHED: 'secondary', PAUSED: 'outline',
};
const statusLabel: Record<string, string> = { ACTIVE: 'Faol', FINISHED: 'Tugagan', PAUSED: "To'xtatilgan" };

export default function GroupsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['groups', page, debouncedSearch],
    queryFn: () => groupsApi.getAll({ page, limit: 10, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); toast({ title: 'Guruh o\'chirildi' }); setDeleteId(null); },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const groups = data?.data?.data?.items || [];
  const meta = data?.data?.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guruhlar</h1>
          <p className="text-muted-foreground">Jami: {meta?.total || 0} ta guruh</p>
        </div>
        <Button onClick={() => { setSelected(null); setOpenForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Guruh yaratish
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Guruh nomini qidiring..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guruh</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>O'qituvchi</TableHead>
                <TableHead>Jadval</TableHead>
                <TableHead>Xona</TableHead>
                <TableHead>O'quvchilar</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-20" /></TableCell>)}</TableRow>)
              ) : groups.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground"><Users2 className="mx-auto h-10 w-10 mb-2 opacity-20" />Guruhlar topilmadi</TableCell></TableRow>
              ) : (
                groups.map((group: any) => (
                  <TableRow key={group.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: group.course?.color || '#6366f1' }} />
                        <span className="font-medium text-sm">{group.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{group.course?.name}</Badge></TableCell>
                    <TableCell className="text-sm">{group.teacher?.user?.firstName} {group.teacher?.user?.lastName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{group.schedule || '-'}</TableCell>
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
                      <Badge variant={statusVariant[group.status]} className="text-xs">{statusLabel[group.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(group); setOpenForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(group.id)}>
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
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{selected ? 'Guruhni tahrirlash' : 'Yangi guruh yaratish'}</DialogTitle></DialogHeader>
          <GroupForm group={selected} onSuccess={() => { setOpenForm(false); queryClient.invalidateQueries({ queryKey: ['groups'] }); }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guruhni o'chirishni tasdiqlang</AlertDialogTitle>
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
