'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  firstName: z.string().min(2, 'Ism kamida 2 ta belgi'),
  lastName: z.string().min(2, 'Familiya kamida 2 ta belgi'),
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(8, 'Parol kamida 8 ta belgi').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Katta, kichik harf va raqam bo\'lishi shart'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const response = await authApi.register(data);
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      toast({ title: "Ro'yxatdan o'tdingiz!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: 'Xato', description: error.response?.data?.message || 'Ro\'yxatdan o\'tishda xatolik', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-white to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950 p-4 relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-400/25 dark:bg-indigo-600/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-400/25 dark:bg-violet-600/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-300/20 dark:bg-purple-700/15 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating decorative shapes */}
      <div className="absolute top-20 right-20 w-8 h-8 border-2 border-violet-300/40 dark:border-violet-500/30 rounded-lg -rotate-12 animate-float-slow pointer-events-none" />
      <div className="absolute bottom-24 left-24 w-5 h-5 bg-indigo-300/40 dark:bg-indigo-500/30 rounded-full animate-float-slow animation-delay-4000 pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">EduCRM Pro</h1>
            <p className="text-xs text-muted-foreground">Ta'lim markazini boshqaring</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Ro'yxatdan o'tish</CardTitle>
            <CardDescription className="text-center">Yangi hisob yarating</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Ism</Label>
                  <Input {...register('firstName')} placeholder="Bobur" className={errors.firstName ? 'border-destructive' : ''} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Familiya</Label>
                  <Input {...register('lastName')} placeholder="Aliyev" className={errors.lastName ? 'border-destructive' : ''} />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...register('email')} type="email" placeholder="example@mail.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Parol</Label>
                <div className="relative">
                  <Input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ro'yxatdan o'tish
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Hisobingiz bormi?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">Kirish</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
