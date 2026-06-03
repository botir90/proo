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
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { useToast } from '@/hooks/use-toast';
import { coursesApi } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  duration: z.number().int().min(1),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export function CourseForm({ course, onSuccess }: { course: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEdit = !!course;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, color: '#6366f1', duration: 3 },
  });

  useEffect(() => {
    if (course) reset({ name: course.name, description: course.description || '', price: Number(course.price), duration: course.duration, color: course.color || '#6366f1', isActive: course.isActive });
  }, [course, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? coursesApi.update(course.id, data) : coursesApi.create(data),
    onSuccess: () => { toast({ title: isEdit ? 'Kurs yangilandi' : 'Kurs qo\'shildi' }); onSuccess(); },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const color = watch('color');
  const isActive = watch('isActive');

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Kurs nomi *</Label>
        <Input {...register('name')} placeholder="English A1" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Tavsif</Label>
        <Textarea {...register('description')} rows={2} placeholder="Kurs haqida qisqacha ma'lumot" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Narx (so'm) *</Label>
          <Input {...register('price', { valueAsNumber: true })} type="number" placeholder="1200000" />
        </div>
        <div className="space-y-1.5">
          <Label>Davomiylik (oy) *</Label>
          <Input {...register('duration', { valueAsNumber: true })} type="number" placeholder="3" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Rang</Label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setValue('color', c)}
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-foreground' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={(v) => setValue('isActive', v)} id="isActive" />
        <Label htmlFor="isActive">Faol kurs</Label>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Saqlash' : "Qo'shish"}
        </Button>
      </div>
    </form>
  );
}
