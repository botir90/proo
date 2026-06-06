'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, Users, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';

const CELL = 52;

export default function ParentLoginPage() {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router    = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

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

  const handleLogin = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api/v1'}/auth/parent-login`,
        { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({parentPhone:phone.trim()}) },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message||'Xato');
      const { accessToken, student } = json.data;
      login({ id:student.userId, email:'', firstName:student.firstName, lastName:student.lastName, role:'PARENT', status:'ACTIVE', createdAt:'' },
        accessToken, accessToken);
      toast({ title:`Xush kelibsiz! ${student.firstName} ${student.lastName} ota-onasi` });
      router.push('/parent');
    } catch (e: any) {
      toast({ title:'Xato', description:e.message, variant:'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background:'linear-gradient(135deg,#060915 0%,#080d1e 50%,#060b18 100%)' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-[140px]"
          style={{ background:'radial-gradient(circle,rgba(25,55,130,0.28) 0%,transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px]"
          style={{ background:'radial-gradient(circle,rgba(15,45,110,0.22) 0%,transparent 70%)' }} />
      </div>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse at center,transparent 40%,rgba(4,6,14,0.7) 100%)' }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#1a4a8a,#0d2d5e)', boxShadow:'0 0 24px rgba(30,100,220,0.45)' }}>
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Ota-ona portali</h1>
            <p className="text-[11px] text-blue-300/60 tracking-[0.2em] uppercase">EduCRM Pro</p>
          </div>
        </div>

        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background:'rgba(8,14,30,0.82)', border:'1px solid rgba(80,140,220,0.18)',
            backdropFilter:'blur(24px)', boxShadow:'0 8px 48px rgba(5,15,50,0.6),inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background:'linear-gradient(90deg,transparent,rgba(80,160,255,0.35),transparent)' }} />

          <div className="mb-8">
            <h2 className="text-[1.25rem] font-semibold text-white">Tizimga kirish</h2>
            <p className="text-sm text-slate-400 mt-0.5">Farzandingizning ota-ona telefon raqamini kiriting</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Telefon raqami</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                  style={{ color: focused ? '#60a5fa' : '#64748b' }} />
                <input type="tel" placeholder="+998901234567" value={phone}
                  onChange={e=>setPhone(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                  onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                  style={{ background:'rgba(255,255,255,0.04)',
                    border:`1.5px solid ${focused?'rgba(80,160,255,0.5)':'rgba(80,140,220,0.18)'}`,
                    boxShadow: focused?'0 0 0 3px rgba(59,130,246,0.09)':'none',
                    caretColor:'#60a5fa' }} />
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading||!phone.trim()}
              className="w-full py-3 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{ background: !phone.trim()?'rgba(30,50,100,0.4)':'linear-gradient(135deg,#1a50a0,#0e3578)',
                boxShadow: phone.trim()?'0 4px 24px rgba(20,70,180,0.38)':'none',
                cursor: !phone.trim()?'not-allowed':'pointer' }}
              onMouseEnter={e=>{if(phone.trim()&&!loading){e.currentTarget.style.background='linear-gradient(135deg,#2060b8,#1040a0)';e.currentTarget.style.transform='translateY(-1px)';}}}
              onMouseLeave={e=>{if(phone.trim()&&!loading){e.currentTarget.style.background='linear-gradient(135deg,#1a50a0,#0e3578)';e.currentTarget.style.transform='translateY(0)';}}}
            >
              {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Kirish...</>:<><ShieldCheck className="w-4 h-4"/>Kirish</>}
            </button>
          </div>

          <div className="mt-6 rounded-xl overflow-hidden" style={{ border:'1px solid rgba(80,140,220,0.12)', background:'rgba(255,255,255,0.02)' }}>
            <div className="px-4 py-2.5" style={{ borderBottom:'1px solid rgba(80,140,220,0.1)', background:'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Test hisob</p>
            </div>
            <button type="button" onClick={()=>setPhone('+998906666666')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs transition-all duration-150 text-left"
              style={{ borderLeft:'2px solid transparent' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(80,140,220,0.09)';e.currentTarget.style.borderLeft='2px solid rgba(80,160,255,0.4)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderLeft='2px solid transparent';}}>
              <span className="font-semibold text-slate-300">Bobur Aliyev — ota-onasi</span>
              <span className="font-mono text-slate-500 text-[10px]">+998906666666</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-600 text-center mt-5">
            O'qituvchi / Admin?{' '}
            <a href="/login" className="text-blue-400/80 hover:text-blue-300 transition-colors">Bu yerga bosing</a>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <ShieldCheck className="w-3 h-3 text-slate-700" />
          <p className="text-[10px] text-slate-700 tracking-wide">256-bit SSL shifrlash bilan himoyalangan</p>
        </div>
      </div>
    </div>
  );
}
