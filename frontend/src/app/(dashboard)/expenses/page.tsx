'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, TrendingDown, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { expensesApi } from '@/lib/api';
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils';

const CATEGORIES = ['Ijara', 'Kommunal', 'Internet', "Ta'mirlash", 'Jihozlar', 'Reklama', 'Maosh', 'Boshqa'];

const CAT_COLORS: Record<string, string> = {
  'Ijara': '#6366f1', 'Kommunal': '#06b6d4', 'Internet': '#8b5cf6',
  "Ta'mirlash": '#f59e0b', 'Jihozlar': '#10b981', 'Reklama': '#ec4899',
  'Maosh': '#14b8a6', 'Boshqa': '#94a3b8',
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Ijara', description: '', date: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', month, year],
    queryFn: () => expensesApi.getAll({ month: parseInt(month), year: parseInt(year) }),
  });

  const info = data?.data?.data;
  const expenses: any[] = info?.items ?? [];
  const totalAmount: number = info?.totalAmount ?? 0;
  const byCategory: Record<string, number> = info?.byCategory ?? {};

  const createMutation = useMutation({
    mutationFn: () => expensesApi.create({
      title: form.title,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description || undefined,
      date: form.date || undefined,
    }),
    onSuccess: () => {
      toast({ title: 'Xarajat qo\'shildi' });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setOpenForm(false);
      setForm({ title: '', amount: '', category: 'Ijara', description: '', date: '' });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Xarajat o'chirildi" });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xarajatlar</h1>
          <p className="text-muted-foreground">Oylik chiqimlarni kuzating</p>
        </div>
        <Button onClick={() => setOpenForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Xarajat qo'shish
        </Button>
      </div>

      {/* Filtr */}
      <div className="flex gap-3">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Jami va kategoriyalar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="col-span-2 md:col-span-1 border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-xs text-red-600 font-medium">Jami xarajat</p>
            </div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{MONTHS[parseInt(month) - 1]} {year}</p>
          </CardContent>
        </Card>
        {Object.entries(byCategory).slice(0, 3).map(([cat, amount]) => (
          <Card key={cat}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[cat] ?? '#94a3b8' }} />
                <p className="text-xs text-muted-foreground font-medium">{cat}</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(amount)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Xarajatlar ro'yxati */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : expenses.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <Wallet className="mx-auto h-10 w-10 mb-2 opacity-20" />
          <p>Bu oyda xarajat yo'q</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[e.category] ?? '#94a3b8' }} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs h-5">{e.category}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                    {e.description && <span className="text-xs text-muted-foreground truncate">{e.description}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="font-bold text-red-600">{formatCurrency(Number(e.amount))}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Xarajat qo'shish dialogi */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Xarajat qo'shish</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nomi *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Masalan: Fevral ijarasi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Summa (so'm) *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="2000000" />
              </div>
              <div className="space-y-1.5">
                <Label>Kategoriya *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sana</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Izoh</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ixtiyoriy..." />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpenForm(false)}>Bekor</Button>
              <Button
                className="flex-1"
                disabled={!form.title || !form.amount || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Qo'shish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
