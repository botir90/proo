'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email:    z.string().email("Email noto'g'ri"),
  password: z.string().min(6, 'Parol kamida 6 ta belgi'),
});
type LoginForm = z.infer<typeof loginSchema>;

const DEMO = [
  { role: 'Super Admin', email: 'superadmin@educrm.pro', password: 'Super@123' },
  { role: 'Admin',       email: 'admin@educrm.pro',      password: 'Admin@123' },
  { role: 'Manager',     email: 'manager@educrm.pro',    password: 'Manager@1' },
  { role: "O'qituvchi",  email: 'teacher@educrm.pro',    password: 'Teacher@1' },
  { role: "O'quvchi",    email: 'student@educrm.pro',    password: 'Student@1' },
];

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router    = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // ── Animated globe ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let raf: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Globe center: right side of screen
      const cx = canvas.width  * 0.72;
      const cy = canvas.height * 0.50;
      const R  = Math.min(canvas.width, canvas.height) * 0.36;

      const NUM_LON = 20;
      const NUM_LAT = 14;

      // Soft glow fill
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grd.addColorStop(0,   'rgba(99,102,241,0.06)');
      grd.addColorStop(0.7, 'rgba(139,92,246,0.03)');
      grd.addColorStop(1,   'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Globe outline circle
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99,102,241,0.22)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Latitude lines (horizontal circles)
      for (let i = 1; i < NUM_LAT; i++) {
        const phi = (i / NUM_LAT) * Math.PI;
        const ry  = cy + R * Math.cos(phi);
        const rx  = R  * Math.sin(phi);
        if (rx < 2) continue;
        ctx.beginPath();
        ctx.ellipse(cx, ry, rx, rx * 0.13, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(99,102,241,0.11)';
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }

      // Longitude lines (rotating vertical ellipses)
      for (let i = 0; i < NUM_LON; i++) {
        const lon    = (i / NUM_LON) * Math.PI + angle;
        const cosL   = Math.cos(lon);
        const absC   = Math.abs(cosL);

        // Front-facing lines brighter
        const alpha  = cosL > 0 ? 0.08 + absC * 0.18 : 0.04 + absC * 0.06;
        const lw     = cosL > 0 ? 0.9 : 0.45;

        ctx.beginPath();
        ctx.ellipse(cx, cy, absC * R, R, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
        ctx.lineWidth   = lw;
        ctx.stroke();
      }

      // Equator highlight
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * 0.13, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139,92,246,0.18)';
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      // Soft outer glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99,102,241,0.06)';
      ctx.lineWidth   = 12;
      ctx.stroke();

      angle += 0.004;
      raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const onSubmit: SubmitHandler<LoginForm> = async ({ email, password }) => {
    try {
      const res = await authApi.login({ email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      login(user, accessToken, refreshToken);
      toast({ title: 'Xush kelibsiz!', description: `${user.firstName} ${user.lastName}` });
      router.push('/dashboard');
    } catch (err: any) {
      toast({ title: 'Xato', description: err.response?.data?.message || 'Login amalga oshmadi', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 35%, #ede9fe 65%, #f0f4ff 100%)' }}>

      {/* Subtle background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-8%] w-[50vw] h-[50vw] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-8%] w-[45vw] h-[45vw] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Rotating globe canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Login form */}
      <div className="w-full max-w-md relative z-10" style={{ animation: 'fadeIn .5s ease' }}>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#1e1b4b' }}>EduCRM Pro</h1>
            <p className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: '#6366f1' }}>Ta'lim boshqaruv tizimi</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1.5px solid rgba(99,102,241,0.16)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(99,102,241,0.12), 0 1px 0 rgba(255,255,255,0.9) inset',
          }}>

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.5), transparent)' }} />

          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#1e1b4b' }}>Tizimga kirish</h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Hisob ma'lumotlaringizni kiriting</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6366f1' }}>Email</label>
              <input type="email" placeholder="admin@educrm.pro" {...register('email')}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'rgba(99,102,241,0.04)',
                  border: `1.5px solid ${errors.email ? 'rgba(239,68,68,0.55)' : 'rgba(99,102,241,0.2)'}`,
                  color: '#1e1b4b',
                }}
                onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(99,102,241,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                onBlur={e  => { e.currentTarget.style.border = `1.5px solid ${errors.email ? 'rgba(239,68,68,0.55)' : 'rgba(99,102,241,0.2)'}`; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6366f1' }}>Parol</label>
                <Link href="/forgot-password" className="text-[11px] transition-colors" style={{ color: '#8b5cf6' }}>Unutdingizmi?</Link>
              </div>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" {...register('password')}
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(99,102,241,0.04)',
                    border: `1.5px solid ${errors.password ? 'rgba(239,68,68,0.55)' : 'rgba(99,102,241,0.2)'}`,
                    color: '#1e1b4b',
                  }}
                  onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(99,102,241,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e  => { e.currentTarget.style.border = `1.5px solid ${errors.password ? 'rgba(239,68,68,0.55)' : 'rgba(99,102,241,0.2)'}`; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1"
                  style={{ color: '#9ca3af' }}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-1"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
              onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.5)'; } }}
              onMouseLeave={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; } }}
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Tekshirilmoqda...</>
                : <><ShieldCheck className="w-4 h-4" />Kirish</>}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 rounded-xl overflow-hidden"
            style={{ border: '1.5px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.03)' }}>
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>Test hisoblar</p>
            </div>
            <div className="p-2 space-y-0.5">
              {DEMO.map(c => (
                <button key={c.email} type="button"
                  onClick={() => { setValue('email', c.email, { shouldValidate: true }); setValue('password', c.password, { shouldValidate: true }); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 text-left"
                  style={{ borderLeft: '2px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderLeft = '2px solid rgba(99,102,241,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '2px solid transparent'; }}>
                  <span className="font-semibold w-24 shrink-0" style={{ color: '#4338ca' }}>{c.role}</span>
                  <span className="font-mono text-[10px] truncate" style={{ color: '#9ca3af' }}>{c.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-1.5 text-center">
            <p className="text-[11px]" style={{ color: '#9ca3af' }}>
              Hisobingiz yo'qmi?{' '}
              <Link href="/register" className="font-medium transition-colors" style={{ color: '#6366f1' }}>Ro'yxatdan o'ting</Link>
            </p>
            <p className="text-[11px]" style={{ color: '#9ca3af' }}>
              Ota-ona?{' '}
              <Link href="/parent-login" className="font-medium transition-colors" style={{ color: '#6366f1' }}>Ota-ona portaliga kiring</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <ShieldCheck className="w-3 h-3" style={{ color: '#c4b5fd' }} />
          <p className="text-[10px] tracking-wide" style={{ color: '#c4b5fd' }}>256-bit SSL shifrlash bilan himoyalangan</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
