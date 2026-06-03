'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { paymentsApi, studentsApi, groupsApi } from '@/lib/api';
import { formatCurrency, getMonthName, MONTHS } from '@/lib/utils';

// Single unified schema used for both create and update
const schema = z.object({
  studentId: z.string().optional(),
  groupId: z.string().optional(),
  amount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).optional(),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE']).optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const methodLabels: Record<string, string> = {
  CASH: 'Naqd',
  CARD: 'Karta',
  BANK_TRANSFER: "Bank o'tkazmasi",
  ONLINE: 'Online',
};

export function PaymentForm({ payment, onSuccess }: { payment: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEdit = !!payment;
  const now = new Date();

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => studentsApi.getAll({ limit: 100 }),
    enabled: !isEdit,
  });
  const { data: groupsData } = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsApi.getAll({ limit: 100 }),
    enabled: !isEdit,
  });

  const students = studentsData?.data?.data?.items || [];
  const groups = groupsData?.data?.data?.items || [];

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'CASH',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      paidAmount: 0,
    },
  });

  useEffect(() => {
    if (payment) {
      reset({
        paidAmount: Number(payment.paidAmount) || 0,
        method: payment.method,
        description: payment.description || '',
      });
    }
  }, [payment, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? paymentsApi.update(payment.id, data) : paymentsApi.create(data),
    onSuccess: () => {
      toast({ title: isEdit ? "To'lov yangilandi" : "To'lov qo'shildi" });
      onSuccess();
    },
    onError: (e: any) =>
      toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const method = watch('method');
  const studentId = watch('studentId');
  const groupId = watch('groupId');

  if (isEdit) {
    return (
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-1">
          <p className="font-medium">
            {payment.student?.user?.firstName} {payment.student?.user?.lastName}
          </p>
          <p className="text-sm text-muted-foreground">
            {payment.group?.course?.name} - {getMonthName(payment.month)} {payment.year}
          </p>
          <div className="flex gap-4 text-sm mt-2">
            <span>
              Jami: <strong>{formatCurrency(Number(payment.amount))}</strong>
            </span>
            <span>
              Qoldiq:{' '}
              <strong className="text-destructive">{formatCurrency(Number(payment.debt))}</strong>
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>To'lanadigan summa</Label>
          <Input {...register('paidAmount', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>To'lov usuli</Label>
          <Select
            value={method}
            onValueChange={(v) => setValue('method', v as FormData['method'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(methodLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Izoh</Label>
          <Textarea {...register('description')} rows={2} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>O'quvchi *</Label>
          <Select onValueChange={(v) => setValue('studentId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="O'quvchini tanlang" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.user?.firstName} {s.user?.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Guruh *</Label>
          <Select onValueChange={(v) => setValue('groupId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Guruhni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g: any) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Summa *</Label>
          <Input {...register('amount', { valueAsNumber: true })} type="number" placeholder="1200000" />
        </div>
        <div className="space-y-1.5">
          <Label>To'langan summa</Label>
          <Input {...register('paidAmount', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Oy</Label>
          <Select
            defaultValue={String(now.getMonth() + 1)}
            onValueChange={(v) => setValue('month', parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Yil</Label>
          <Input
            {...register('year', { valueAsNumber: true })}
            type="number"
            defaultValue={now.getFullYear()}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Muddat</Label>
          <Input {...register('dueDate')} type="date" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>To'lov usuli</Label>
        <Select
          defaultValue="CASH"
          onValueChange={(v) => setValue('method', v as FormData['method'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(methodLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Izoh</Label>
        <Textarea {...register('description')} rows={2} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Qo'shish
        </Button>
      </div>
    </form>
  );
}
