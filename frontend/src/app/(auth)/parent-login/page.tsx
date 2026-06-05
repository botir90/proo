'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Phone, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';

export default function ParentLoginPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/parent-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentPhone: phone.trim() }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Xato');

      const { accessToken, student } = json.data;
      login(
        { id: student.userId, email: '', firstName: student.firstName, lastName: student.lastName, role: 'PARENT', status: 'ACTIVE', createdAt: '' },
        accessToken,
        accessToken, // PARENT uchun refresh token = access token (8h muddatli)
      );
      toast({ title: `Xush kelibsiz! ${student.firstName} ${student.lastName} ota-onasi` });
      router.push('/parent');
    } catch (e: any) {
      toast({ title: 'Xato', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">EduCRM Pro</h1>
            <p className="text-xs text-muted-foreground">Ota-ona portali</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="pb-4 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Ota-ona portali</CardTitle>
            <CardDescription>
              Farzandingizning telefon raqamini (ota-ona raqami) kiriting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ota-ona telefon raqami</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="+998901234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading || !phone.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kirish
            </Button>

            {/* Demo */}
            <div className="p-3 bg-muted rounded-lg text-xs space-y-1.5">
              <p className="font-semibold text-muted-foreground">Test hisob (bosib kirish):</p>
              <button
                type="button"
                onClick={() => setPhone('+998906666666')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-background transition-colors text-left"
              >
                <span className="font-medium text-foreground">Bobur Aliyev — ota-onasi</span>
                <span className="font-mono text-muted-foreground">+998906666666</span>
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              O'qituvchi / Admin?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">Bu yerga bosing</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
