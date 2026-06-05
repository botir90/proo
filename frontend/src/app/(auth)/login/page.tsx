'use client';

import { useState, useEffect, useRef } from 'react';
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

const loginSchema = z.object({
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 ta belgi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  /* ── Particle network animation ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    const rgb = isDark ? '167,139,250' : '109,40,217';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const COUNT = 80;
    const MAX_DIST = 140;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number };
    const pts: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: Math.random() * 2 + 1,
    }));

    let raf: number;

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},0.55)`;
        ctx.fill();
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${rgb},${0.28 * (1 - d / MAX_DIST)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(frame);
    };

    frame();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      const response = await authApi.login({ email: data.email!, password: data.password! });
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      toast({ title: 'Xush kelibsiz!', description: `${user.firstName} ${user.lastName}` });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.response?.data?.message || 'Login amalga oshmadi',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-white to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950 p-4 relative overflow-hidden">

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-purple-300/15 dark:bg-purple-700/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Floating shapes */}
      <div className="absolute top-16 left-16 w-8 h-8 border-2 border-violet-400/35 dark:border-violet-500/30 rounded-lg rotate-12 animate-float-slow pointer-events-none" />
      <div className="absolute top-24 right-24 w-5 h-5 bg-indigo-400/35 dark:bg-indigo-500/25 rounded-full animate-float-slow animation-delay-2000 pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-6 h-6 border-2 border-purple-400/35 dark:border-purple-500/25 rounded-full animate-float-slow animation-delay-4000 pointer-events-none" />
      <div className="absolute bottom-32 right-16 w-4 h-4 bg-violet-400/35 dark:bg-violet-500/25 rotate-45 animate-float-slow animation-delay-6000 pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EduCRM Pro</h1>
            <p className="text-xs text-muted-foreground">Ta'lim markazini boshqaring</p>
          </div>
        </div>

        {/* Card with glow ring */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-2xl opacity-20 blur-lg animate-pulse pointer-events-none" />
          <Card className="relative shadow-xl border-0 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center">Tizimga kirish</CardTitle>
              <CardDescription className="text-center">Email va parolingizni kiriting</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email manzil</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@educrm.pro"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Parol</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Parolni unutdingizmi?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kirish
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 p-3 bg-muted rounded-lg text-xs space-y-2">
                <p className="font-semibold text-muted-foreground">Test hisoblar (bosib kirish):</p>
                {[
                  { role: 'Super Admin', email: 'superadmin@educrm.pro', password: 'Super@123' },
                  { role: 'Admin',       email: 'admin@educrm.pro',      password: 'Admin@123' },
                  { role: 'Manager',     email: 'manager@educrm.pro',    password: 'Manager@1' },
                  { role: "O'qituvchi",  email: 'teacher@educrm.pro',    password: 'Teacher@1' },
                  { role: "O'quvchi",    email: 'student@educrm.pro',    password: 'Student@1' },
                ].map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => {
                      setValue('email', c.email, { shouldValidate: true });
                      setValue('password', c.password, { shouldValidate: true });
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-background transition-colors cursor-pointer text-left"
                  >
                    <span className="font-medium text-foreground">{c.role}</span>
                    <span className="font-mono text-muted-foreground">{c.email}</span>
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Hisobingiz yo'qmi?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Ro'yxatdan o'ting
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Ota-ona?{' '}
                <Link href="/parent-login" className="text-primary hover:underline font-medium">
                  Ota-ona portaliga kiring
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
