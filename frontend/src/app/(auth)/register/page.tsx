'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  firstName: z.string().min(2, 'Ism kamida 2 ta belgi'),
  lastName:  z.string().min(2, 'Familiya kamida 2 ta belgi'),
  email:     z.string().email("Email noto'g'ri"),
  password:  z.string().min(8, 'Parol kamida 8 ta belgi')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Katta, kichik harf va raqam bo'lishi shart"),
});
type FormData = z.infer<typeof schema>;

const CELL = 52;

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router    = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    type Cell = { x: number; y: number; phase: number; speed: number; hue: number; baseAlpha: number };
    let cells: Cell[] = [];
    const build = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const cols = Math.ceil(canvas.width/CELL)+1, rows = Math.ceil(canvas.height/CELL)+1;
      cells = [];
      for (let r=0;r<rows;r++) for (let c=0;c<cols;c++)
        cells.push({x:c*CELL,y:r*CELL,phase:Math.random()*Math.PI*2,speed:0.25+Math.random()*0.5,hue:205+Math.random()*35,baseAlpha:0.018+Math.random()*0.055});
    };
    build();
    let t=0,raf:number;
    const frame=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const c of cells){const a=c.baseAlpha+0.04*Math.sin(t*c.speed+c.phase);ctx.fillStyle=`hsla(${c.hue},65%,55%,${a})`;ctx.fillRect(c.x,c.y,CELL-1,CELL-1);}
      if(Math.random()<0.015){const c=cells[Math.floor(Math.random()*cells.length)];ctx.fillStyle=`hsla(${c.hue},80%,70%,0.18)`;ctx.fillRect(c.x,c.y,CELL-1,CELL-1);}
      t+=0.012; raf=requestAnimationFrame(frame);
    };
    frame(); window.addEventListener('resize',build);
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',build);};
  }, []);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const response = await authApi.register(data);
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      toast({ title: "Ro'yxatdan o'tdingiz!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: 'Xato', description: error.response?.data?.message || "Ro'yxatdan o'tishda xatolik", variant: 'destructive' });
    }
  };

  const fi = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.border='1px solid rgba(80,160,255,0.5)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(59,130,246,0.09)'; };
  const bi = (e: React.FocusEvent<HTMLInputElement>, err: boolean) => { e.currentTarget.style.border=`1.5px solid ${err?'rgba(239,68,68,0.55)':'rgba(80,140,220,0.18)'}`;e.currentTarget.style.boxShadow='none'; };

  const inputStyle = (err: boolean) => ({
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${err ? 'rgba(239,68,68,0.55)' : 'rgba(80,140,220,0.18)'}`,
    caretColor: '#60a5fa',
  });

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
            style={{ background:'linear-gradient(135deg,#1a4a8a,#0d2d5e)', boxShadow:'0 0 24px rgba(30,100,220,0.45)' }}>
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
            <h2 className="text-[1.25rem] font-semibold text-white">Ro'yxatdan o'tish</h2>
            <p className="text-sm text-slate-400 mt-0.5">Yangi hisob yarating</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Ism</label>
                <input {...register('firstName')} placeholder="Bobur"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                  style={inputStyle(!!errors.firstName)} onFocus={fi} onBlur={e=>bi(e,!!errors.firstName)} />
                {errors.firstName&&<p className="text-[11px] text-red-400">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Familiya</label>
                <input {...register('lastName')} placeholder="Aliyev"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                  style={inputStyle(!!errors.lastName)} onFocus={fi} onBlur={e=>bi(e,!!errors.lastName)} />
                {errors.lastName&&<p className="text-[11px] text-red-400">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Email</label>
              <input type="email" {...register('email')} placeholder="example@mail.com"
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                style={inputStyle(!!errors.email)} onFocus={fi} onBlur={e=>bi(e,!!errors.email)} />
              {errors.email&&<p className="text-[11px] text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Parol</label>
              <div className="relative">
                <input type={showPwd?'text':'password'} {...register('password')} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                  style={inputStyle(!!errors.password)} onFocus={fi} onBlur={e=>bi(e,!!errors.password)} />
                <button type="button" onClick={()=>setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors p-1">
                  {showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {errors.password&&<p className="text-[11px] text-red-400">{errors.password.message}</p>}
              {!errors.password&&<p className="text-[10px] text-slate-600">Katta, kichik harf va raqam bo'lishi shart</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-1"
              style={{ background:'linear-gradient(135deg,#1a50a0,#0e3578)', boxShadow:'0 4px 24px rgba(20,70,180,0.38)' }}
              onMouseEnter={e=>{if(!isSubmitting){e.currentTarget.style.background='linear-gradient(135deg,#2060b8,#1040a0)';e.currentTarget.style.transform='translateY(-1px)';}}}
              onMouseLeave={e=>{if(!isSubmitting){e.currentTarget.style.background='linear-gradient(135deg,#1a50a0,#0e3578)';e.currentTarget.style.transform='translateY(0)';}}}
            >
              {isSubmitting?<><Loader2 className="w-4 h-4 animate-spin"/>Yuklanmoqda...</>:"Ro'yxatdan o'tish"}
            </button>
          </form>

          <p className="text-[11px] text-slate-600 text-center mt-5">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="text-blue-400/80 hover:text-blue-300 transition-colors">Kirish</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
