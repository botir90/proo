'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, CreditCard, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentsApi } from '@/lib/api';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { PaymentStatus } from '@/types';
import { PaymentForm } from '@/components/forms/payment-form';

const statusConfig: Record<PaymentStatus, { label: string; variant: any; icon: any }> = {
  PAID: { label: "To'langan", variant: 'default', icon: CheckCircle },
  PENDING: { label: 'Kutilmoqda', variant: 'secondary', icon: Clock },
  PARTIAL: { label: "Qisman to'langan", variant: 'outline', icon: TrendingUp },
  OVERDUE: { label: 'Muddati o\'tgan', variant: 'destructive', icon: AlertCircle },
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: () => paymentsApi.getAll({ page, limit: 10, status: statusFilter === 'ALL' ? undefined : statusFilter }),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['payments', 'revenue', currentYear],
    queryFn: () => paymentsApi.getMonthlyRevenue(currentYear),
  });

  const payments = data?.data?.data?.items || [];
  const meta = data?.data?.data?.meta;
  const revenue = revenueData?.data?.data;

  const currentMonth = new Date().getMonth() + 1;
  const currentRevenue = revenue?.monthly?.find((m: any) => m.month === currentMonth)?.revenue || 0;
  const totalRevenue = revenue?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">To'lovlar</h1>
          <p className="text-muted-foreground">Jami: {meta?.total || 0} ta to'lov</p>
        </div>
        <Button onClick={() => { setSelected(null); setOpenForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> To'lov qo'shish
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Bu oylik daromad</p>
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(currentRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Yillik daromad</p>
            <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Kutilayotgan</p>
            <p className="text-xl font-bold text-yellow-600">{payments.filter((p: any) => p.status === 'PENDING').length} ta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Muddati o'tgan</p>
            <p className="text-xl font-bold text-destructive">{payments.filter((p: any) => p.status === 'OVERDUE').length} ta</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="O'quvchi nomini qidiring..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Holat bo'yicha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barchasi</SelectItem>
            <SelectItem value="PAID">To'langan</SelectItem>
            <SelectItem value="PENDING">Kutilmoqda</SelectItem>
            <SelectItem value="PARTIAL">Qisman</SelectItem>
            <SelectItem value="OVERDUE">Muddati o'tgan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>O'quvchi</TableHead>
                <TableHead>Guruh/Kurs</TableHead>
                <TableHead>Oy</TableHead>
                <TableHead>Summa</TableHead>
                <TableHead>To'landi</TableHead>
                <TableHead>Qoldiq</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead>Muddati</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-16" /></TableCell>)}</TableRow>)
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground"><CreditCard className="mx-auto h-10 w-10 mb-2 opacity-20" />To'lovlar topilmadi</TableCell></TableRow>
              ) : (
                payments.map((payment: any) => {
                  const conf = statusConfig[payment.status as PaymentStatus];
                  const Icon = conf.icon;
                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm">
                        {payment.student?.user?.firstName} {payment.student?.user?.lastName}
                        <p className="text-xs text-muted-foreground">{payment.student?.user?.phone}</p>
                      </TableCell>
                      <TableCell className="text-sm">{payment.group?.course?.name}</TableCell>
                      <TableCell className="text-sm">{getMonthName(payment.month)} {payment.year}</TableCell>
                      <TableCell className="font-medium text-sm">{formatCurrency(Number(payment.amount))}</TableCell>
                      <TableCell className="text-green-600 text-sm font-medium">{formatCurrency(Number(payment.paidAmount))}</TableCell>
                      <TableCell className={`text-sm font-medium ${Number(payment.debt) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formatCurrency(Number(payment.debt))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={conf.variant} className="gap-1 text-xs">
                          <Icon className="h-3 w-3" />
                          {conf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(payment.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelected(payment); setOpenForm(true); }}>
                          To'lov qilish
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
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
          <DialogHeader><DialogTitle>{selected ? "To'lovni yangilash" : "Yangi to'lov"}</DialogTitle></DialogHeader>
          <PaymentForm payment={selected} onSuccess={() => { setOpenForm(false); queryClient.invalidateQueries({ queryKey: ['payments'] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
