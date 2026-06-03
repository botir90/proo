'use client';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts
        .filter((t) => t.open !== false)
        .map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-background animate-fade-in',
              toast.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground',
            )}
          >
            {toast.variant === 'destructive' ? (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-500" />
            )}
            <div className="flex-1">
              {toast.title && <p className="font-medium text-sm">{toast.title}</p>}
              {toast.description && <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
    </div>
  );
}
