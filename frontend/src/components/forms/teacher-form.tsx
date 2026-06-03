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

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal('')),
  phone: z.string().optional(),
  salary: z.number().min(0),
  experience: z.number().min(0).optional(),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function TeacherForm({ teacher, onSuccess }: { teacher: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEdit = !!teacher;
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { salary: 0, experience: 0 },
  });

  useEffect(() => {
    if (teacher) {
      reset({
        firstName: teacher.user?.firstName || '',
        lastName: teacher.user?.lastName || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        salary: Number(teacher.salary) || 0,
        experience: teacher.experience || 0,
        bio: teacher.bio || '',
      });
      setSubjects(teacher.subjects || []);
    }
  }, [teacher, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = { ...data, subjects };
      return isEdit ? teachersApi.update(teacher.id, payload) : teachersApi.create(payload);
    },
    onSuccess: () => { toast({ title: isEdit ? "O'qituvchi yangilandi" : "O'qituvchi qo'shildi" }); onSuccess(); },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const addSubject = () => {
    if (subjectInput.trim() && !subjects.includes(subjectInput.trim())) {
      setSubjects([...subjects, subjectInput.trim()]);
      setSubjectInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Ism *</Label><Input {...register('firstName')} placeholder="John" />{errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}</div>
        <div className="space-y-1.5"><Label>Familiya *</Label><Input {...register('lastName')} placeholder="Smith" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Email *</Label><Input {...register('email')} type="email" /></div>
        {!isEdit && <div className="space-y-1.5"><Label>Parol *</Label><Input {...register('password')} type="password" placeholder="Min 8 ta belgi" /></div>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Maosh (so'm)</Label><Input {...register('salary', { valueAsNumber: true })} type="number" placeholder="5000000" /></div>
        <div className="space-y-1.5"><Label>Tajriba (yil)</Label><Input {...register('experience', { valueAsNumber: true })} type="number" placeholder="5" /></div>
      </div>
      <div className="space-y-1.5">
        <Label>Fanlar</Label>
        <div className="flex gap-2">
          <Input value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())} placeholder="Fan nomini kiriting" />
          <Button type="button" variant="outline" onClick={addSubject}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {subjects.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1">
              {s}
              <button type="button" onClick={() => setSubjects(subjects.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      </div>
      <div className="space-y-1.5"><Label>Bio</Label><Textarea {...register('bio')} rows={2} /></div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Saqlash' : "Qo'shish"}
        </Button>
      </div>
    </form>
  );
}
