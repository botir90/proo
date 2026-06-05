'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Play, Pause, Trophy, CheckCircle2,
  Clock, ChevronRight, Loader2, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { quizApi, groupsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';

// ─── Test ishlash sahifasi (student) ─────────────────────────────────────────
function QuizTaker({ quiz, onDone }: { quiz: any; onDone: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  const questions: any[] = quiz.questions ?? [];

  const submitMutation = useMutation({
    mutationFn: () => quizApi.submit(quiz.id, answers),
    onSuccess: (res) => {
      setResult(res.data.data);
      queryClient.invalidateQueries({ queryKey: ['quiz', 'my'] });
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  if (result) {
    const pct = result.percent ?? 0;
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
          {pct}%
        </div>
        <div>
          <h2 className="text-2xl font-bold">Test yakunlandi!</h2>
          <p className="text-muted-foreground mt-1">
            {result.score} / {result.total} ta to'g'ri javob
          </p>
          <p className="text-sm mt-2">
            {pct >= 80 ? '🎉 Ajoyib natija!' : pct >= 60 ? '👍 Yaxshi natija' : '📚 Ko\'proq o\'qing'}
          </p>
        </div>
        <Button onClick={onDone}>Orqaga qaytish</Button>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Savol {current + 1} / {questions.length}</span>
          <span>{Object.keys(answers).length} ta javoblangan</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Savol */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <p className="text-lg font-semibold mb-5">{q.question}</p>
          <div className="space-y-3">
            {q.options?.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                  answers[q.id] === i
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  {['A', 'B', 'C', 'D'][i]}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigatsiya */}
      <div className="flex justify-between gap-3">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>Oldingi</Button>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent(c => c + 1)} disabled={answers[q.id] === undefined}>
            Keyingi <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || Object.keys(answers).length < questions.length}
            className="gap-2"
          >
            {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Topshirish
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Barcha {questions.length} ta savolga javob berish kerak
      </p>
    </div>
  );
}

// ─── Test yaratish formi ──────────────────────────────────────────────────────
interface Question { question: string; options: string[]; answer: number }

function CreateQuizDialog({ groups, open, onClose, onCreated }: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], answer: 0 },
  ]);

  const addQuestion = () =>
    setQuestions(q => [...q, { question: '', options: ['', '', '', ''], answer: 0 }]);

  const updateQuestion = (i: number, field: string, value: any) =>
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const updateOption = (qi: number, oi: number, value: string) =>
    setQuestions(q => q.map((item, idx) =>
      idx === qi ? { ...item, options: item.options.map((o, j) => j === oi ? value : o) } : item
    ));

  const createMutation = useMutation({
    mutationFn: () => quizApi.create({ groupId, title, timeLimit: timeLimit ? parseInt(timeLimit) : undefined, questions }),
    onSuccess: () => {
      toast({ title: 'Test yaratildi' });
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
      onCreated(groupId);
      onClose();
    },
    onError: (e: any) => toast({ title: 'Xato', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const canSubmit = groupId && title && questions.every(q => q.question && q.options.every(o => o));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Yangi test yaratish</DialogTitle></DialogHeader>
        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Guruh *</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>
                  {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vaqt chegarasi (daqiqa)</Label>
              <Input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} placeholder="30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Test nomi *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Unit 5 — Vocabulary Test" />
          </div>

          {/* Savollar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Savollar ({questions.length} ta)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" /> Savol qo'shish
              </Button>
            </div>

            {questions.map((q, qi) => (
              <Card key={qi} className="border-l-4 border-l-primary/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-muted-foreground mt-2 w-6">{qi + 1}.</span>
                    <Input
                      className="flex-1"
                      value={q.question}
                      onChange={e => updateQuestion(qi, 'question', e.target.value)}
                      placeholder="Savol matni..."
                    />
                    {questions.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive"
                        onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-8">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(qi, 'answer', oi)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                            q.answer === oi ? 'border-green-500 bg-green-100 text-green-700' : 'border-border text-muted-foreground'
                          }`}
                        >
                          {['A', 'B', 'C', 'D'][oi]}
                        </button>
                        <Input
                          value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          placeholder={`Variant ${['A', 'B', 'C', 'D'][oi]}`}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pl-8">
                    To'g'ri javob: <span className="font-semibold text-green-600">{['A', 'B', 'C', 'D'][q.answer]}</span>
                    {' '}— yashil tugmani bosib belgilang
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Bekor</Button>
            <Button className="flex-1" disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test yaratish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Natijalar dialogi ────────────────────────────────────────────────────────
function ResultsDialog({ quizId, open, onClose }: { quizId: string; open: boolean; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['quiz-results', quizId],
    queryFn: () => quizApi.getResults(quizId),
    enabled: open && !!quizId,
  });
  const results: any[] = data?.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Test natijalari</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Hali natijalar yo'q</p>
          ) : results.map((r: any, i: number) => {
            const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
            return (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{r.student?.user?.firstName} {r.student?.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{r.score}/{r.total} to'g'ri</p>
                  </div>
                </div>
                <Badge variant={pct >= 80 ? 'default' : pct >= 60 ? 'secondary' : 'destructive'}>
                  {pct}%
                </Badge>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Asosiy sahifa ────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewGroup, setViewGroup] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState<any>(null);
  const [resultsQuizId, setResultsQuizId] = useState('');

  const { data: myGroupsData } = useQuery({
    queryKey: ['groups', 'my-groups'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: isTeacher,
  });
  const { data: allGroupsData } = useQuery({
    queryKey: ['groups', 'all-list'],
    queryFn: () => groupsApi.getAll({ limit: 100 }),
    enabled: !isTeacher && !isStudent,
  });

  const groups = isTeacher
    ? (myGroupsData?.data?.data ?? [])
    : (allGroupsData?.data?.data?.items ?? []);

  const { data: groupQuizzesData, isLoading: gqLoading } = useQuery({
    queryKey: ['quiz', 'group', viewGroup],
    queryFn: () => quizApi.getByGroup(viewGroup),
    enabled: !!viewGroup && !isStudent,
  });

  const { data: myQuizzesData, isLoading: myLoading } = useQuery({
    queryKey: ['quiz', 'my'],
    queryFn: () => quizApi.getMyQuizzes(),
    enabled: isStudent,
  });

  const { data: quizDetailData } = useQuery({
    queryKey: ['quiz-detail', takingQuiz?.id],
    queryFn: () => quizApi.getOne(takingQuiz.id),
    enabled: !!takingQuiz?.id && isStudent,
  });

  const groupQuizzes: any[] = groupQuizzesData?.data?.data ?? [];
  const myQuizzes: any[] = myQuizzesData?.data?.data ?? [];

  const toggleMutation = useMutation({
    mutationFn: (id: string) => quizApi.toggle(id),
    onSuccess: (res) => {
      const msg = res.data.data?.isActive ? 'Faollashtirildi ✓' : 'To\'xtatildi';
      toast({ title: msg });
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Test o\'chirildi' });
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
    },
  });

  // ─── Student: testlar ro'yxati ──────────────────────────────────────────────
  if (isStudent) {
    if (takingQuiz && quizDetailData?.data?.data) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setTakingQuiz(null)} className="-ml-2">← Orqaga</Button>
            <h1 className="text-xl font-bold mt-1">{takingQuiz.title}</h1>
            {takingQuiz.timeLimit && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5" /> {takingQuiz.timeLimit} daqiqa
              </p>
            )}
          </div>
          <QuizTaker quiz={quizDetailData.data.data} onDone={() => setTakingQuiz(null)} />
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Testlar</h1>
          <p className="text-muted-foreground">O'qituvchi bergan testlarni topshiring</p>
        </div>

        {myLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : myQuizzes.length === 0 ? (
          <Card><CardContent className="py-14 text-center text-muted-foreground">
            <Trophy className="mx-auto h-10 w-10 mb-2 opacity-20" />
            <p>Hozircha test yo'q</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {myQuizzes.map((q: any) => {
              const attempt = q.attempts?.[0];
              const done = !!attempt?.finishedAt;
              const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : 0;
              return (
                <Card key={q.id} className={done ? 'opacity-70' : ''}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{q.title}</p>
                        {!q.isActive && <Badge variant="secondary" className="text-xs">Nofaol</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{q.group?.course?.name} • {q._count?.questions} ta savol</p>
                      {q.timeLimit && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {q.timeLimit} daqiqa
                        </p>
                      )}
                    </div>
                    {done ? (
                      <div className="text-right">
                        <Badge variant={pct >= 80 ? 'default' : pct >= 60 ? 'secondary' : 'destructive'}>
                          {pct}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {attempt.score}/{attempt.total} to'g'ri
                        </p>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!q.isActive}
                        onClick={() => setTakingQuiz(q)}
                        className="gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Boshlash
                      </Button>
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

  // ─── Teacher / Admin: boshqaruv ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testlar</h1>
          <p className="text-muted-foreground">Online testlarni yarating va boshqaring</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Test yaratish
        </Button>
      </div>

      <div className="max-w-xs">
        <Select value={viewGroup} onValueChange={setViewGroup}>
          <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
          <SelectContent>
            {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!viewGroup ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="mx-auto h-12 w-12 mb-3 opacity-20" />
          <p>Testlarni ko'rish uchun guruhni tanlang</p>
        </div>
      ) : gqLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : groupQuizzes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Bu guruhda test yo'q</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {groupQuizzes.map((q: any) => (
            <Card key={q.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{q.title}</p>
                      <Badge variant={q.isActive ? 'default' : 'secondary'} className="text-xs">
                        {q.isActive ? '● Faol' : 'Nofaol'}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{q._count?.questions ?? 0} ta savol</span>
                      <span>{q._count?.attempts ?? 0} ta urinish</span>
                      {q.timeLimit && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{q.timeLimit} daq</span>}
                      <span>{formatDate(q.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8"
                      onClick={() => setResultsQuizId(q.id)}
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> Natijalar
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleMutation.mutate(q.id)}
                      title={q.isActive ? 'To\'xtatish' : 'Faollashtirish'}
                    >
                      {q.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(q.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateQuizDialog
        groups={groups}
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(gId: string) => setViewGroup(gId)}
      />

      <ResultsDialog
        quizId={resultsQuizId}
        open={!!resultsQuizId}
        onClose={() => setResultsQuizId('')}
      />
    </div>
  );
}
