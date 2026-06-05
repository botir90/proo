'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(user?.role === 'PARENT' ? '/parent' : '/dashboard');
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated) return null;
  if (isAuthenticated) return null;

  return <>{children}</>;
}
