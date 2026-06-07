'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { studentsApi } from '@/lib/api';
import { Student } from '@/types';

const passwordRule = z
  .string()
  .min(8, 'Kamida 8 ta belgi')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Katta harf, kichik harf va raqam bo'lishi kerak");

const baseSchema = z.object({
  firstName:   z.string().min(2, 'Kamida 2 ta belgi'),
  lastName:    z.string().min(2, 'Kamida 2 ta belgi'),
  email:       z.string().email("Email noto'g'ri"),
  phone:       z.string().optional(),
  parentPhone: z.string().optional(),
  address:     z.string().optional(),
  birthDate:   z.string().optional(),
  gender:      z.enum(['MALE', 'FEMALE']).optional(),
  notes:       z.string().optional(),
});

const createSchema = baseSchema.extend({ password: passwordRule });
const editSchema   = baseSchema;

type CreateData = z.infer<typeof createSchema>;
type EditData   = z.infer<typeof editSchema>;
type FormData   = CreateData;

interface Props {
  student: Student | null;
  onSuccess: () => void;
}

function stripEmpty(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== '' && v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

export function StudentForm({ student, onSuccess }: Props) {
  const { toast } = useToast();
  const isEdit = !!student;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { gender: undefined },
  });

  useEffect(() => {
    if (student) {
      reset({
        firstName:   student.user?.firstName || '',
        lastName:    student.user?.lastName  || '',
        email:       student.user?.email     || '',
        phone:       student.user?.phone     || '',
        parentPhone: student.parentPhone     || '',
        address:     student.address         || '',
        birthDate:   student.birthDate ? student.birthDate.split('T')[0] : '',
        gender:      student.gender,
        notes:       student.notes           || '',
      });
    } else {
      reset({ gender: undefined });
    }
  }, [student, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = stripEmpty(data as Record<string, any>);
      return isEdit
        ? studentsApi.update(student!.id, payload)
        : studentsApi.create(payload);
    },
    onSuccess: () => {
      toast({ title: isEdit ? "O'quvchi yangilandi" : "O'quvchi qo'shildi" });
      onSuccess();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : (msg || 'Noma\'lum xato');
      toast({ title: 'Xato', description: text, variant: 'destructive' });
    },
  });

  const gender = watch('gender');

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Ism *</Label>
          <Input {...register('firstName')} placeholder="Bobur" />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Familiya *</Label>
          <Input {...register('lastName')} placeholder="Aliyev" />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input {...register('email')} type="email" placeholder="bobur@mail.com" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>Parol * <span className="text-xs text-muted-foreground">(Katta/kichik harf + raqam)</span></Label>
            <Input {...register('password')} type="password" placeholder="Masalan: Bobur123" />
            {'password' in errors && errors.password && (
              <p className="text-xs text-destructive">{(errors as any).password.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input {...register('phone')} placeholder="+998901234567" />
        </div>
        <div className="space-y-1.5">
          <Label>Ota-ona telefoni</Label>
          <Input {...register('parentPhone')} placeholder="+998901234567" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tug'ilgan sana</Label>
          <Input {...register('birthDate')} type="date" />
        </div>
        <div className="space-y-1.5">
          <Label>Jinsi</Label>
          <Select
            value={gender ?? ''}
            onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE', { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Erkak</SelectItem>
              <SelectItem value="FEMALE">Ayol</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Manzil</Label>
        <Input {...register('address')} placeholder="Toshkent, Chilonzor tumani" />
      </div>

      <div className="space-y-1.5">
        <Label>Qo'shimcha izoh</Label>
        <Textarea {...register('notes')} placeholder="O'quvchi haqida qo'shimcha ma'lumot" rows={2} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Saqlash' : "Qo'shish"}
        </Button>
      </div>
    </form>
  );
}
