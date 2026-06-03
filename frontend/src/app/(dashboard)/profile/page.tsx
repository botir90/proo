'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Camera, User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Katta, kichik harf va raqam bo\'lishi shart'),
});

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Menejer',
  TEACHER: "O'qituvchi",
  STUDENT: "O'quvchi",
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => authApi.getProfile().then(() =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().accessToken}` },
        body: JSON.stringify(data),
      }).then(r => r.json())
    ),
    onSuccess: (data) => {
      updateUser({ firstName: data.data?.firstName, lastName: data.data?.lastName, phone: data.data?.phone });
      toast({ title: 'Profil yangilandi' });
    },
    onError: () => toast({ title: 'Xato', variant: 'destructive' }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => authApi.changePassword(data),
    onSuccess: () => {
      toast({ title: 'Parol o\'zgartirildi' });
      passwordForm.reset();
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-muted-foreground">Shaxsiy ma'lumotlaringizni boshqaring</p>
      </div>

      {/* Avatar Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={getAvatarUrl(user.avatar)} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {roleLabels[user.role] || user.role}
                </Badge>
                <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {user.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{user.phone || 'Telefon kiritilmagan'}</span>
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <Calendar className="h-4 w-4" />
                <span>Oxirgi kirish: {formatDate(user.lastLoginAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'info' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Ma'lumotlarni tahrirlash
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'password' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Parol o'zgartirish
        </button>
      </div>

      {/* Profile Form */}
      {activeTab === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shaxsiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit((d) => updateProfileMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ism</Label>
                  <Input {...profileForm.register('firstName')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Familiya</Label>
                  <Input {...profileForm.register('lastName')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input {...profileForm.register('phone')} placeholder="+998901234567" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Saqlash
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Form */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parol o'zgartirish</CardTitle>
            <CardDescription>Xavfsizlik uchun kuchli parol tanlang</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit((d) => changePasswordMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Joriy parol</Label>
                <Input {...passwordForm.register('currentPassword')} type="password" placeholder="••••••••" />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Yangi parol</Label>
                <Input {...passwordForm.register('newPassword')} type="password" placeholder="••••••••" />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Kamida 8 ta belgi, katta/kichik harf va raqam bo'lishi shart</p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  O'zgartirish
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
