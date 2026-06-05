'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationsApi } from '@/lib/api';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import { NotificationType } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const typeConfig: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  WARNING: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  ERROR: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  SUCCESS: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  PAYMENT_DUE: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  DEBT_ALERT: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  SYSTEM: { icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
};

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const debtAlertMutation = useMutation({
    mutationFn: (withSms: boolean) => api.post('/notifications/check-debts', { withSms }),
    onSuccess: (res) => {
      const d = res.data?.data;
      toast({ title: `${d?.notificationsSent ?? 0} ta bildirishnoma${d?.smsSent ? `, ${d.smsSent} ta SMS` : ''} yuborildi` });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 50 }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); toast({ title: 'Barchasi o\'qildi' }); },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data?.data?.items || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bildirishnomalar</h1>
          {unreadCount > 0 && <p className="text-muted-foreground">{unreadCount} ta o'qilmagan</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()}>
            <CheckCheck className="mr-2 h-4 w-4" /> Barchasini o'qish
          </Button>
        )}
      </div>

      {/* Admin: Qarz ogohlantirish + SMS paneli */}
      {isAdmin && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              Qarz ogohlantirishlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Muddati o'tgan to'lovlar bo'lgan o'quvchilarga bildirishnoma va SMS yuborish
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={debtAlertMutation.isPending}
                onClick={() => debtAlertMutation.mutate(false)}
              >
                {debtAlertMutation.isPending && !debtAlertMutation.variables
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Bell className="h-3.5 w-3.5" />}
                Faqat bildirishnoma
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-orange-500 hover:bg-orange-600"
                disabled={debtAlertMutation.isPending}
                onClick={() => debtAlertMutation.mutate(true)}
              >
                {debtAlertMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <MessageSquare className="h-3.5 w-3.5" />}
                Bildirishnoma + SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="py-4"><div className="h-4 bg-muted rounded w-3/4 mb-2" /><div className="h-3 bg-muted rounded w-1/2" /></CardContent></Card>)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="mx-auto h-12 w-12 mb-3 opacity-20" />
          <p>Bildirishnomalar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => {
            const conf = typeConfig[notif.type as NotificationType] || typeConfig.INFO;
            const Icon = conf.icon;
            return (
              <Card key={notif.id} className={`transition-all ${!notif.isRead ? 'border-primary/30 shadow-sm' : 'opacity-70'}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${conf.bg}`}>
                      <Icon className={`h-4 w-4 ${conf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notif.isRead && <Badge className="text-xs h-5 px-1.5">Yangi</Badge>}
                          <button
                            onClick={() => deleteMutation.mutate(notif.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => markOneMutation.mutate(notif.id)}
                      className="text-xs text-primary hover:underline mt-1 ml-10"
                    >
                      O'qildi deb belgilash
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
