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

const CELL = 52;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    type Cell = { x: number; y: number; phase: number; speed: number; hue: number; baseAlpha: number };
    let cells: Cell[] = [];

    const build = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.ceil(canvas.width  / CELL) + 1;
      const rows = Math.ceil(canvas.height / CELL) + 1;
      cells = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          cells.push({ x: c*CELL, y: r*CELL, phase: Math.random()*Math.PI*2,
            speed: 0.25+Math.random()*0.5, hue: 205+Math.random()*35, baseAlpha: 0.018+Math.random()*0.055 });
    };
    build();

    let t = 0, raf: number;
    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const c of cells) {
        const a = c.baseAlpha + 0.04 * Math.sin(t * c.speed + c.phase);
        ctx.fillStyle = `hsla(${c.hue},65%,55%,${a})`;
        ctx.fillRect(c.x, c.y, CELL-1, CELL-1);
      }
      if (Math.random() < 0.015) {
        const c = cells[Math.floor(Math.random()*cells.length)];
        ctx.fillStyle = `hsla(${c.hue},80%,70%,0.18)`;
        ctx.fillRect(c.x, c.y, CELL-1, CELL-1);
      }
      t += 0.012;
      raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener('resize', build);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', build); };
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
      style={{ background: 'linear-gradient(135deg,#060915 0%,#080d1e 50%,#060b18 100%)' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle,rgba(25,55,130,0.28) 0%,transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle,rgba(15,45,110,0.22) 0%,transparent 70%)' }} />
      </div>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center,transparent 40%,rgba(4,6,14,0.7) 100%)' }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1a4a8a,#0d2d5e)', boxShadow: '0 0 24px rgba(30,100,220,0.45)' }}>
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">EduCRM Pro</h1>
            <p className="text-[11px] text-blue-300/60 tracking-[0.2em] uppercase">Ta'lim boshqaruv tizimi</p>
          </div>
        </div>

        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background:'rgba(8,14,30,0.82)', border:'1px solid rgba(80,140,220,0.18)',
            backdropFilter:'blur(24px)', boxShadow:'0 8px 48px rgba(5,15,50,0.6),inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background:'linear-gradient(90deg,transparent,rgba(80,160,255,0.35),transparent)' }} />

          <div className="mb-6">
            <h2 className="text-[1.25rem] font-semibold text-white">Tizimga kirish</h2>
            <p className="text-sm text-slate-400 mt-0.5">Hisob ma'lumotlaringizni kiriting</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Email</label>
              <input type="email" placeholder="admin@educrm.pro" {...register('email')}
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                style={{ background:'rgba(255,255,255,0.04)', border:`1.5px solid ${errors.email?'rgba(239,68,68,0.55)':'rgba(80,140,220,0.18)'}`, caretColor:'#60a5fa' }}
                onFocus={e=>{e.currentTarget.style.border='1px solid rgba(80,160,255,0.5)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(59,130,246,0.09)';}}
                onBlur={e=>{e.currentTarget.style.border=`1.5px solid ${errors.email?'rgba(239,68,68,0.55)':'rgba(80,140,220,0.18)'}`;e.currentTarget.style.boxShadow='none';}} />
              {errors.email&&<p className="text-[11px] text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Parol</label>
                <Link href="/forgot-password" className="text-[11px] text-blue-400/80 hover:text-blue-300 transition-colors">Unutdingizmi?</Link>
              </div>
              <div className="relative">
                <input type={showPwd?'text':'password'} placeholder="••••••••" {...register('password')}
                  className="w-full px-4 py-3 pr-11 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                  style={{ background:'rgba(255,255,255,0.04)', border:`1.5px solid ${errors.password?'rgba(239,68,68,0.55)':'rgba(80,140,220,0.18)'}`, caretColor:'#60a5fa' }}
                  onFocus={e=>{e.currentTarget.style.border='1px solid rgba(80,160,255,0.5)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(59,130,246,0.09)';}}
                  onBlur={e=>{e.currentTarget.style.border=`1.5px solid ${errors.password?'rgba(239,68,68,0.55)':'rgba(80,140,220,0.18)'}`;e.currentTarget.style.boxShadow='none';}} />
                <button type="button" onClick={()=>setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors p-1">
                  {showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {errors.password&&<p className="text-[11px] text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-1"
              style={{ background:'linear-gradient(135deg,#1a50a0,#0e3578)', boxShadow:'0 4px 24px rgba(20,70,180,0.38)' }}
              onMouseEnter={e=>{if(!isSubmitting){e.currentTarget.style.background='linear-gradient(135deg,#2060b8,#1040a0)';e.currentTarget.style.transform='translateY(-1px)';}}}
              onMouseLeave={e=>{if(!isSubmitting){e.currentTarget.style.background='linear-gradient(135deg,#1a50a0,#0e3578)';e.currentTarget.style.transform='translateY(0)';}}}
            >
              {isSubmitting?<><Loader2 className="w-4 h-4 animate-spin"/>Tekshirilmoqda...</>:<><ShieldCheck className="w-4 h-4"/>Kirish</>}
            </button>
          </form>

          <div className="mt-6 rounded-xl overflow-hidden" style={{ border:'1px solid rgba(80,140,220,0.12)', background:'rgba(255,255,255,0.02)' }}>
            <div className="px-4 py-2.5" style={{ borderBottom:'1px solid rgba(80,140,220,0.1)', background:'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Test hisoblar</p>
            </div>
            <div className="p-2 space-y-0.5">
              {DEMO.map(c=>(
                <button key={c.email} type="button"
                  onClick={()=>{ setValue('email',c.email,{shouldValidate:true}); setValue('password',c.password,{shouldValidate:true}); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 text-left"
                  style={{ borderLeft:'2px solid transparent' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(80,140,220,0.09)';e.currentTarget.style.borderLeft='2px solid rgba(80,160,255,0.4)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderLeft='2px solid transparent';}}>
                  <span className="font-semibold text-slate-300 w-24 shrink-0">{c.role}</span>
                  <span className="font-mono text-slate-500 text-[10px] truncate">{c.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-1.5 text-center">
            <p className="text-[11px] text-slate-600">Hisobingiz yo'qmi?{' '}
              <Link href="/register" className="text-blue-400/80 hover:text-blue-300 transition-colors">Ro'yxatdan o'ting</Link>
            </p>
            <p className="text-[11px] text-slate-600">Ota-ona?{' '}
              <Link href="/parent-login" className="text-blue-400/80 hover:text-blue-300 transition-colors">Ota-ona portaliga kiring</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <ShieldCheck className="w-3 h-3 text-slate-700" />
          <p className="text-[10px] text-slate-700 tracking-wide">256-bit SSL shifrlash bilan himoyalangan</p>
        </div>
      </div>
    </div>
  );
}
