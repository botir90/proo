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
import { useToast } from '@/hooks/use-toast';
import { groupsApi, coursesApi, teachersApi } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2),
  courseId: z.string().uuid(),
  teacherId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string().optional(),
  schedule: z.string().optional(),
  room: z.string().optional(),
  maxStudents: z.number().int().min(1).optional(),
  status: z.enum(['ACTIVE', 'FINISHED', 'PAUSED']).optional(),
});

type FormData = z.infer<typeof schema>;

export function GroupForm({ group, onSuccess }: { group: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEdit = !!group;

  const { data: coursesData } = useQuery({ queryKey: ['courses', 'all'], queryFn: () => coursesApi.getAll({ limit: 100 }) });
  const { data: teachersData } = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => teachersApi.getAll({ limit: 100 }) });

  const courses = coursesData?.data?.data?.items || [];
  const teachers = teachersData?.data?.data?.items || [];

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { maxStudents: 20, status: 'ACTIVE' },
  });

  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        courseId: group.courseId,
        teacherId: group.teacherId,
        startDate: group.startDate?.split('T')[0],
        endDate: group.endDate?.split('T')[0] || '',
        schedule: group.schedule || '',
        room: group.room || '',
        maxStudents: group.maxStudents,
        status: group.status,
      });
    }
  }, [group, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? groupsApi.update(group.id, data) : groupsApi.create(data),
    onSuccess: () => { toast({ title: isEdit ? 'Guruh yangilandi' : 'Guruh yaratildi' }); onSuccess(); },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const courseId = watch('courseId');
  const teacherId = watch('teacherId');
  const status = watch('status');

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Guruh nomi *</Label>
        <Input {...register('name')} placeholder="English A1 - Group 1" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Kurs *</Label>
          <Select value={courseId} onValueChange={(v) => setValue('courseId', v)}>
            <SelectTrigger><SelectValue placeholder="Kursni tanlang" /></SelectTrigger>
            <SelectContent>
              {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>O'qituvchi *</Label>
          <Select value={teacherId} onValueChange={(v) => setValue('teacherId', v)}>
            <SelectTrigger><SelectValue placeholder="O'qituvchini tanlang" /></SelectTrigger>
            <SelectContent>
              {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Boshlanish sanasi *</Label>
          <Input {...register('startDate')} type="date" />
        </div>
        <div className="space-y-1.5">
          <Label>Tugash sanasi</Label>
          <Input {...register('endDate')} type="date" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Jadval</Label>
          <Input {...register('schedule')} placeholder="Du,Cho,Ju 14:00-16:00" />
        </div>
        <div className="space-y-1.5">
          <Label>Xona</Label>
          <Input {...register('room')} placeholder="Room 101" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Max o'quvchilar</Label>
          <Input {...register('maxStudents', { valueAsNumber: true })} type="number" />
        </div>
        <div className="space-y-1.5">
          <Label>Holati</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Faol</SelectItem>
              <SelectItem value="PAUSED">To'xtatilgan</SelectItem>
              <SelectItem value="FINISHED">Tugagan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Saqlash' : 'Yaratish'}
        </Button>
      </div>
    </form>
  );
}
