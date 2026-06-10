'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, Users, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';

export default function ParentLoginPage() {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const router    = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/parent-login`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentPhone: phone.trim() }) },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Xato');
      const { accessToken, student } = json.data;
      login(
        { id: student.userId, email: '', firstName: student.firstName, lastName: student.lastName, role: 'PARENT', status: 'ACTIVE', createdAt: '' },
        accessToken, accessToken,
      );
      toast({ title: `Xush kelibsiz! ${student.firstName} ${student.lastName} ota-onasi` });
      router.push('/parent');
    } catch (e: any) {
      toast({ title: 'Xato', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 35%, #ede9fe 65%, #f0f4ff 100%)' }}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-8%] w-[50vw] h-[50vw] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-8%] w-[45vw] h-[45vw] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10" style={{ animation: 'fadeIn .5s ease' }}>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#1e1b4b' }}>Ota-ona portali</h1>
            <p className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: '#6366f1' }}>EduCRM Pro</p>
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

          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.5), transparent)' }} />

          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#1e1b4b' }}>Tizimga kirish</h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Farzandingizning ota-ona telefon raqamini kiriting</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6366f1' }}>Telefon raqami</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                  style={{ color: focused ? '#6366f1' : '#9ca3af' }} />
                <input type="tel" placeholder="+998901234567" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(99,102,241,0.04)',
                    border: `1.5px solid ${focused ? 'rgba(99,102,241,0.55)' : 'rgba(99,102,241,0.2)'}`,
                    boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                    color: '#1e1b4b',
                  }} />
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading || !phone.trim()}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: phone.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.25)',
                boxShadow: phone.trim() ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
                cursor: !phone.trim() ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (phone.trim() && !loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.5)'; } }}
              onMouseLeave={e => { if (phone.trim() && !loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; } }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Kirish...</> : <><ShieldCheck className="w-4 h-4" />Kirish</>}
            </button>
          </div>

          {/* Demo account */}
          <div className="mt-6 rounded-xl overflow-hidden"
            style={{ border: '1.5px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.03)' }}>
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>Test hisob</p>
            </div>
            <button type="button" onClick={() => setPhone('+998906666666')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs transition-all duration-150 text-left"
              style={{ borderLeft: '2px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderLeft = '2px solid rgba(99,102,241,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '2px solid transparent'; }}>
              <span className="font-semibold" style={{ color: '#4338ca' }}>Bobur Aliyev — ota-onasi</span>
              <span className="font-mono text-[10px]" style={{ color: '#9ca3af' }}>+998906666666</span>
            </button>
          </div>

          <p className="text-[11px] text-center mt-5" style={{ color: '#9ca3af' }}>
            O'qituvchi / Admin?{' '}
            <a href="/login" className="font-medium transition-colors" style={{ color: '#6366f1' }}>Bu yerga bosing</a>
          </p>
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
