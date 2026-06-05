'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Wallet, CheckCircle2, Clock, AlertCircle, XCircle, Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { myPaymentsApi } from '@/lib/api';
import { formatCurrency, getMonthName } from '@/lib/utils';

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  PAID:    { label: "To'langan",       icon: CheckCircle2, className: 'text-green-600 bg-green-50 border-green-200' },
  PENDING: { label: "Kutilmoqda",      icon: Clock,        className: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  PARTIAL: { label: "Qisman to'langan",icon: AlertCircle,  className: 'text-blue-600 bg-blue-50 border-blue-200' },
  OVERDUE: { label: "Muddati o'tgan",  icon: XCircle,      className: 'text-red-600 bg-red-50 border-red-200' },
};

// ─── Card number formatter ────────────────────────────────────────────────────
function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

// ─── Luhn check ──────────────────────────────────────────────────────────────
function isValidCard(num: string) {
  const digits = num.replace(/\s/g, '');
  if (digits.length !== 16) return false;
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = parseInt(digits[15 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

// ─── Payment dialog ───────────────────────────────────────────────────────────
interface PaymentDialogProps {
  payment: any;
  open: boolean;
  onClose: () => void;
}

function PaymentDialog({ payment, open, onClose }: PaymentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [method, setMethod] = useState<'CARD' | 'ONLINE'>('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  const debt = Number(payment?.debt ?? 0);

  const payMutation = useMutation({
    mutationFn: () =>
      myPaymentsApi.pay(payment.id, {
        amount: debt,
        method: method === 'CARD' ? 'CARD' : 'ONLINE',
        description: method === 'CARD'
          ? `Karta orqali to'lov: **** ${cardNumber.replace(/\s/g, '').slice(-4)}`
          : 'Online to\'lov',
      }),
    onSuccess: () => {
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
    },
    onError: (e: any) => {
      toast({
        title: 'To\'lov amalga oshmadi',
        description: e.response?.data?.message || 'Qayta urinib ko\'ring',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setStep('form');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardHolder('');
    onClose();
  };

  const canSubmit =
    method === 'ONLINE' ||
    (isValidCard(cardNumber) && expiry.length === 5 && cvv.length === 3 && cardHolder.trim().length > 2);

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">To'lov muvaffaqiyatli!</h2>
              <p className="text-muted-foreground mt-1">
                {formatCurrency(debt)} — {payment.group?.course?.name} ({getMonthName(payment.month)})
              </p>
            </div>
            <Button className="w-full mt-2" onClick={handleClose}>Yopish</Button>
          </div>
        ) : step === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle>To'lovni tasdiqlash</DialogTitle>
              <DialogDescription>Quyidagi ma'lumotlarni tekshiring</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Kurs</span><span className="font-medium">{payment.group?.course?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Oy</span><span className="font-medium">{getMonthName(payment.month)} {payment.year}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Summa</span><span className="font-bold text-primary">{formatCurrency(debt)}</span></div>
                {method === 'CARD' && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Karta</span><span className="font-medium">**** {cardNumber.replace(/\s/g, '').slice(-4)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Usul</span><span className="font-medium">{method === 'CARD' ? 'Bank kartasi' : 'Online to\'lov'}</span></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>Orqaga</Button>
                <Button
                  className="flex-1"
                  onClick={() => payMutation.mutate()}
                  disabled={payMutation.isPending}
                >
                  {payMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yuklanmoqda...</>
                  ) : (
                    <><Lock className="mr-2 h-4 w-4" />To'lash</>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>To'lov</DialogTitle>
              <DialogDescription>
                {payment.group?.course?.name} — {getMonthName(payment.month)} {payment.year}
              </DialogDescription>
            </DialogHeader>

            {/* Amount */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">To'lov summasi</p>
              <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(debt)}</p>
            </div>

            {/* Method tabs */}
            <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="CARD" className="gap-2"><CreditCard className="w-4 h-4" />Bank kartasi</TabsTrigger>
                <TabsTrigger value="ONLINE" className="gap-2"><Wallet className="w-4 h-4" />Online</TabsTrigger>
              </TabsList>

              {/* Card form */}
              <TabsContent value="CARD" className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label>Karta raqami</Label>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    className="font-mono text-lg tracking-widest"
                  />
                  {cardNumber.replace(/\s/g, '').length === 16 && !isValidCard(cardNumber) && (
                    <p className="text-xs text-destructive">Karta raqami noto'g'ri</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Karta egasi</Label>
                  <Input
                    placeholder="ISM FAMILIYA"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Muddati (OO/YY)</Label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CVV</Label>
                    <Input
                      placeholder="•••"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      maxLength={3}
                      className="font-mono"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Online payment */}
              <TabsContent value="ONLINE" className="mt-3">
                <div className="border rounded-lg p-4 space-y-3">
                  {[
                    { name: 'Payme', color: 'bg-blue-500', desc: 'payme.uz' },
                    { name: 'Click', color: 'bg-green-500', desc: 'click.uz' },
                    { name: 'Uzum Bank', color: 'bg-orange-500', desc: 'uzumbank.uz' },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${p.color} rounded-lg`} />
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.desc}</p>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary" />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Lock className="w-3 h-3" />
              <span>Ma'lumotlaringiz SSL orqali himoyalangan</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmit}
              onClick={() => setStep('confirm')}
            >
              <Lock className="mr-2 h-4 w-4" />
              {formatCurrency(debt)} — To'lash
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyPaymentsPage() {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => myPaymentsApi.getMyPayments(),
    retry: false,
  });

  const info = data?.data?.data;
  const payments: any[] = info?.payments ?? [];
  const totalDebt: number = info?.totalDebt ?? 0;
  const totalPaid: number = info?.totalPaid ?? 0;
  const pendingCount: number = info?.pendingCount ?? 0;

  const unpaid = payments.filter((p) => p.status !== 'PAID');
  const paid   = payments.filter((p) => p.status === 'PAID');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">To'lovlarim</h1>
        <p className="text-muted-foreground">Kurs to'lovlarini kuzating va to'lang</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-red-600 font-medium">Qoldiq qarz</p>
            <p className="text-xl font-bold text-red-700 mt-0.5">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-green-600 font-medium">Jami to'langan</p>
            <p className="text-xl font-bold text-green-700 mt-0.5">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-yellow-600 font-medium">Kutilayotgan</p>
            <p className="text-xl font-bold text-yellow-700 mt-0.5">{pendingCount} ta</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-3 text-muted-foreground">
            <CreditCard className="w-12 h-12 opacity-25" />
            <p>Hozircha to'lov mavjud emas</p>
            <p className="text-xs">To'lovlar guruhga qo'shilgandan keyin paydo bo'ladi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Unpaid */}
          {unpaid.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                To'lanmagan ({unpaid.length})
              </h2>
              {unpaid.map((p) => {
                const cfg = statusConfig[p.status] ?? statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: p.group?.course?.color ?? '#6366f1' + '22' }}
                          >
                            <CreditCard className="w-5 h-5" style={{ color: p.group?.course?.color ?? '#6366f1' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.group?.course?.name ?? 'Kurs'}</p>
                            <p className="text-xs text-muted-foreground">{getMonthName(p.month)} {p.year}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-destructive">{formatCurrency(Number(p.debt))}</p>
                            {p.status === 'PARTIAL' && (
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(Number(p.paidAmount))} to'landi
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${cfg.className}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <Button size="sm" onClick={() => setSelectedPayment(p)}>
                            To'lash
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Paid */}
          {paid.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                To'langan ({paid.length})
              </h2>
              {paid.map((p) => (
                <Card key={p.id} className="opacity-70">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex-shrink-0 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.group?.course?.name ?? 'Kurs'}</p>
                          <p className="text-xs text-muted-foreground">{getMonthName(p.month)} {p.year}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="font-bold text-green-600">{formatCurrency(Number(p.paidAmount))}</p>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium text-green-600 bg-green-50 border-green-200">
                          <CheckCircle2 className="w-3 h-3" />
                          To'langan
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <PaymentDialog
        payment={selectedPayment}
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}
