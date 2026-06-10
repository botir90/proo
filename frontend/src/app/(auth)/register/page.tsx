'use client';

import { useState } from 'react';
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

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const router    = useRouter();
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
      toast({ title: 'Xato', description: error.response?.data?.message || "Ro'yxatdan o'tishda xatolik", variant: 'destructive' });
    }
  };

  const inputBase = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200";
  const inputStyle = (err: boolean) => ({
    background: 'rgba(99,102,241,0.04)',
    border: `1.5px solid ${err ? 'rgba(239,68,68,0.55)' : 'rgba(99,102,241,0.2)'}`,
    color: '#1e1b4b',
  });
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = '1.5px solid rgba(99,102,241,0.55)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>, err: boolean) => {
    e.currentTarget.style.border = `1.5px solid ${err ? 'rgba(239,68,68,0.55)' : 'rgba(99,102,241,0.2)'}`;
    e.currentTarget.style.boxShadow = 'none';
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

          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.5), transparent)' }} />

          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#1e1b4b' }}>Ro'yxatdan o'tish</h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Yangi hisob yarating</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6366f1' }}>Ism</label>
                <input {...register('firstName')} placeholder="Bobur" className={inputBase}
                  style={inputStyle(!!errors.firstName)}
                  onFocus={onFocus} onBlur={e => onBlur(e, !!errors.firstName)} />
                {errors.firstName && <p className="text-[11px] text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6366f1' }}>Familiya</label>
                <input {...register('lastName')} placeholder="Aliyev" className={inputBase}
                  style={inputStyle(!!errors.lastName)}
                  onFocus={onFocus} onBlur={e => onBlur(e, !!errors.lastName)} />
                {errors.lastName && <p className="text-[11px] text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6366f1' }}>Email</label>
              <input type="email" {...register('email')} placeholder="example@mail.com" className={inputBase}
                style={inputStyle(!!errors.email)}
                onFocus={onFocus} onBlur={e => onBlur(e, !!errors.email)} />
              {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6366f1' }}>Parol</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} {...register('password')} placeholder="••••••••"
                  className={`${inputBase} pr-11`}
                  style={inputStyle(!!errors.password)}
                  onFocus={onFocus} onBlur={e => onBlur(e, !!errors.password)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1"
                  style={{ color: '#9ca3af' }}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password
                ? <p className="text-[11px] text-red-500">{errors.password.message}</p>
                : <p className="text-[10px]" style={{ color: '#9ca3af' }}>Katta, kichik harf va raqam bo'lishi shart</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-1"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
              onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.5)'; } }}
              onMouseLeave={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; } }}
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Yuklanmoqda...</>
                : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <p className="text-[11px] text-center mt-5" style={{ color: '#9ca3af' }}>
            Hisobingiz bormi?{' '}
            <Link href="/login" className="font-medium transition-colors" style={{ color: '#6366f1' }}>Kirish</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
