'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { teachersApi } from '@/lib/api';

const passwordRule = z
  .string()
  .min(8, 'Kamida 8 ta belgi')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Katta harf, kichik harf va raqam bo'lishi kerak");

const baseSchema = z.object({
  firstName:  z.string().min(2, 'Kamida 2 ta belgi'),
  lastName:   z.string().min(2, 'Kamida 2 ta belgi'),
  email:      z.string().email("Email noto'g'ri"),
  phone:      z.string().optional(),
  salary:     z.number({ invalid_type_error: 'Son kiriting' }).min(0),
  experience: z.number().min(0).optional(),
  bio:        z.string().optional(),
});

const createSchema = baseSchema.extend({ password: passwordRule });

type FormData = z.infer<typeof createSchema>;

function stripEmpty(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== '' && v !== null && v !== undefined && !Number.isNaN(v)) out[k] = v;
  }
  return out;
}

export function TeacherForm({ teacher, onSuccess }: { teacher: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEdit = !!teacher;
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(isEdit ? baseSchema : createSchema),
    defaultValues: { salary: 0, experience: 0 },
  });

  useEffect(() => {
    if (teacher) {
      reset({
        firstName:  teacher.user?.firstName || '',
        lastName:   teacher.user?.lastName  || '',
        email:      teacher.user?.email     || '',
        phone:      teacher.user?.phone     || '',
        salary:     Number(teacher.salary)  || 0,
        experience: teacher.experience      || 0,
        bio:        teacher.bio             || '',
      });
      setSubjects(teacher.subjects || []);
    }
  }, [teacher, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = { ...stripEmpty(data as Record<string, any>), subjects };
      return isEdit ? teachersApi.update(teacher.id, payload) : teachersApi.create(payload);
    },
    onSuccess: () => {
      toast({ title: isEdit ? "O'qituvchi yangilandi" : "O'qituvchi qo'shildi" });
      onSuccess();
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : (msg || "Noma'lum xato");
      toast({ title: 'Xato', description: text, variant: 'destructive' });
    },
  });

  const addSubject = () => {
    const s = subjectInput.trim();
    if (s && !subjects.includes(s)) { setSubjects([...subjects, s]); setSubjectInput(''); }
  };

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Ism *</Label>
          <Input {...register('firstName')} placeholder="John" />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Familiya *</Label>
          <Input {...register('lastName')} placeholder="Smith" />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input {...register('email')} type="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>Parol * <span className="text-xs text-muted-foreground">(Katta/kichik harf + raqam)</span></Label>
            <Input {...register('password')} type="password" placeholder="Masalan: Teacher123" />
            {'password' in errors && errors.password && (
              <p className="text-xs text-destructive">{(errors as any).password.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Maosh (so'm)</Label>
          <Input {...register('salary', { valueAsNumber: true })} type="number" placeholder="5000000" />
          {errors.salary && <p className="text-xs text-destructive">{errors.salary.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Tajriba (yil)</Label>
          <Input {...register('experience', { valueAsNumber: true })} type="number" placeholder="5" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Fanlar</Label>
        <div className="flex gap-2">
          <Input
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
            placeholder="Fan nomini kiriting"
          />
          <Button type="button" variant="outline" onClick={addSubject}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {subjects.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1">
              {s}
              <button type="button" onClick={() => setSubjects(subjects.filter((x) => x !== s))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea {...register('bio')} rows={2} />
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
