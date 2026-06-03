'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, AlertCircle, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { attendanceApi, groupsApi } from '@/lib/api';
import { getInitials, getAvatarUrl, formatDate } from '@/lib/utils';
import { AttendanceStatus } from '@/types';

type AttendanceRecord = { studentId: string; status: AttendanceStatus; note?: string };

const statusConfig = {
  PRESENT: { label: 'Keldi',    icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800' },
  ABSENT:  { label: 'Kelmadi',  icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800' },
  LATE:    { label: 'Kechikdi', icon: Clock,        color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800' },
  EXCUSED: { label: 'Sababli',  icon: AlertCircle,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
};

export default function AttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: groupsData } = useQuery({
    queryKey: ['groups', 'all-list'],
    queryFn: () => groupsApi.getAll({ limit: 100 }),
  });

  const { data: groupData } = useQuery({
    queryKey: ['group-detail', selectedGroup],
    queryFn: () => groupsApi.getOne(selectedGroup),
    enabled: !!selectedGroup,
  });

  const { data: existingData } = useQuery({
    queryKey: ['attendance-check', selectedGroup, date],
    queryFn: () => attendanceApi.getByGroup(selectedGroup, { startDate: date, endDate: date }),
    enabled: !!selectedGroup && !!date,
  });

  const { data: historyData } = useQuery({
    queryKey: ['attendance-history', selectedGroup],
    queryFn: () => attendanceApi.getByGroup(selectedGroup, {}),
    enabled: !!selectedGroup,
  });

  const { data: statsData } = useQuery({
    queryKey: ['attendance-stats', selectedGroup],
    queryFn: () => attendanceApi.getGroupStats(selectedGroup),
    enabled: !!selectedGroup,
  });

  const groups = groupsData?.data?.data?.items || [];
  const groupDetails = groupData?.data?.data;
  const students = groupDetails?.members?.map((m: any) => m.student).filter(Boolean) || [];
  const existingAttendance: any[] = existingData?.data?.data || [];
  const history: any[] = historyData?.data?.data || [];
  const statsResult: any[] = statsData?.data?.data || [];
  const isAlreadySaved = existingAttendance.length > 0;

  const saveMutation = useMutation({
    mutationFn: () => {
      const recordsArray = students.map((s: any) => ({
        studentId: s.id,
        status: records[s.id]?.status || 'PRESENT',
        note: records[s.id]?.note,
      }));
      return attendanceApi.create({ groupId: selectedGroup, date, records: recordsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-check', selectedGroup, date] });
      queryClient.invalidateQueries({ queryKey: ['attendance-history', selectedGroup] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats', selectedGroup] });
      toast({ title: `Davomat saqlandi — ${students.length} ta o'quvchi` });
    },
    onError: (e: any) => toast({
      title: 'Xato',
      description: e.response?.data?.message || 'Saqlashda xato',
      variant: 'destructive',
    }),
  });

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev: Record<string, AttendanceRecord>) => ({ ...prev, [studentId]: { studentId, status } }));
  };

  const setAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceRecord> = {};
    students.forEach((s: any) => { all[s.id] = { studentId: s.id, status }; });
    setRecords(all);
  };

  const getStudentStatus = (studentId: string): AttendanceStatus => {
    if (records[studentId]) return records[studentId].status;
    const existing = existingAttendance.find((a: any) => a.studentId === studentId);
    return existing?.status || 'PRESENT';
  };

  const stats = {
    PRESENT: students.filter((s: any) => getStudentStatus(s.id) === 'PRESENT').length,
    ABSENT:  students.filter((s: any) => getStudentStatus(s.id) === 'ABSENT').length,
    LATE:    students.filter((s: any) => getStudentStatus(s.id) === 'LATE').length,
    EXCUSED: students.filter((s: any) => getStudentStatus(s.id) === 'EXCUSED').length,
  };

  const uniqueDates = [...new Set(history.map((a: any) => a.date?.split('T')[0]))].sort().reverse() as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Davomat</h1>
        <p className="text-muted-foreground">Guruh davomatini qayd eting va tarixini ko'ring</p>
      </div>

      {/* Guruh va sana tanlash */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 flex-1 min-w-52">
              <Label>Guruh</Label>
              <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v); setRecords({}); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Guruhni tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g._count?.members || 0} o'quvchi)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sana</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setRecords({}); }}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {selectedGroup && students.length > 0 && !isAlreadySaved && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAll('PRESENT')}>
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500" /> Hammasi keldi
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAll('ABSENT')}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5 text-red-500" /> Hammasi kelmadi
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedGroup ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="mx-auto h-12 w-12 mb-3 opacity-20" />
          <p>Davomatni boshqarish uchun guruhni tanlang</p>
        </div>
      ) : (
        <Tabs defaultValue="take">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="take">Davomat olish</TabsTrigger>
            <TabsTrigger value="history">Tarix</TabsTrigger>
            <TabsTrigger value="stats">Statistika</TabsTrigger>
          </TabsList>

          {/* ===== DAVOMAT OLISH ===== */}
          <TabsContent value="take" className="mt-4 space-y-4">
            {students.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {(Object.entries(statusConfig) as [AttendanceStatus, any][]).map(([key, conf]) => {
                  const Icon = conf.icon;
                  return (
                    <Card key={key}>
                      <CardContent className="pt-4 pb-3 text-center">
                        <Icon className={`h-5 w-5 mx-auto mb-1 ${conf.color}`} />
                        <p className="text-2xl font-bold">{stats[key] || 0}</p>
                        <p className="text-xs text-muted-foreground">{conf.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{groupDetails?.name}</CardTitle>
                  <CardDescription>{date} — {students.length} ta o'quvchi</CardDescription>
                </div>
                {isAlreadySaved ? (
                  <Badge variant="secondary">✓ Saqlangan</Badge>
                ) : (
                  students.length > 0 && (
                    <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                      {saveMutation.isPending
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Save className="mr-2 h-4 w-4" />}
                      Saqlash
                    </Button>
                  )
                )}
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Bu guruhda o'quvchilar yo'q</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student: any) => {
                      const currentStatus = getStudentStatus(student.id);
                      const conf = statusConfig[currentStatus];
                      return (
                        <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${conf.bg}`}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={getAvatarUrl(student.user?.avatar)} />
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {getInitials(student.user?.firstName, student.user?.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{student.user?.firstName} {student.user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">{student.user?.phone || student.user?.email}</p>
                            </div>
                          </div>
                          {!isAlreadySaved ? (
                            <div className="flex gap-1">
                              {(Object.entries(statusConfig) as [AttendanceStatus, any][]).map(([s, c]) => {
                                const Icon = c.icon;
                                return (
                                  <button
                                    key={s}
                                    onClick={() => setStatus(student.id, s)}
                                    title={c.label}
                                    className={`p-1.5 rounded-md transition-all ${
                                      currentStatus === s
                                        ? `${c.color} scale-110 bg-white dark:bg-gray-800 shadow`
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    <Icon className="h-5 w-5" />
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <Badge variant="outline" className={`${conf.color} border-current text-xs`}>
                              {conf.label}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TARIX ===== */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Davomat tarixi</CardTitle>
                <CardDescription>{uniqueDates.length} ta dars sanasi qayd etilgan</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {uniqueDates.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Davomat ma'lumotlari yo'q</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead className="text-green-600">Keldi</TableHead>
                        <TableHead className="text-red-500">Kelmadi</TableHead>
                        <TableHead className="text-yellow-500">Kechikdi</TableHead>
                        <TableHead className="text-blue-500">Sababli</TableHead>
                        <TableHead>Davomat %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueDates.map((d) => {
                        const dayRecords = history.filter((a: any) => a.date?.startsWith(d));
                        const present = dayRecords.filter((a: any) => a.status === 'PRESENT').length;
                        const absent  = dayRecords.filter((a: any) => a.status === 'ABSENT').length;
                        const late    = dayRecords.filter((a: any) => a.status === 'LATE').length;
                        const excused = dayRecords.filter((a: any) => a.status === 'EXCUSED').length;
                        const rate    = dayRecords.length ? Math.round((present / dayRecords.length) * 100) : 0;
                        return (
                          <TableRow key={d}>
                            <TableCell className="font-medium">{formatDate(d)}</TableCell>
                            <TableCell className="text-green-600 font-semibold">{present}</TableCell>
                            <TableCell className="text-red-500 font-semibold">{absent}</TableCell>
                            <TableCell className="text-yellow-500 font-semibold">{late}</TableCell>
                            <TableCell className="text-blue-500 font-semibold">{excused}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2 max-w-16">
                                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs font-medium w-8">{rate}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== STATISTIKA ===== */}
          <TabsContent value="stats" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">O'quvchilar statistikasi</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {statsResult.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Statistika mavjud emas</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>O'quvchi</TableHead>
                        <TableHead>Jami</TableHead>
                        <TableHead className="text-green-600">Keldi</TableHead>
                        <TableHead className="text-red-500">Kelmadi</TableHead>
                        <TableHead className="text-yellow-500">Kechikdi</TableHead>
                        <TableHead>Davomat %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsResult.map((item: any) => (
                        <TableRow key={item.student?.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={getAvatarUrl(item.student?.user?.avatar)} />
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {getInitials(item.student?.user?.firstName, item.student?.user?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">
                                {item.student?.user?.firstName} {item.student?.user?.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{item.stats?.total}</TableCell>
                          <TableCell className="text-green-600 font-semibold">{item.stats?.present}</TableCell>
                          <TableCell className="text-red-500 font-semibold">{item.stats?.absent}</TableCell>
                          <TableCell className="text-yellow-500 font-semibold">{item.stats?.late}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2 max-w-20">
                                <div
                                  className={`h-2 rounded-full ${
                                    item.stats?.rate >= 80 ? 'bg-green-500'
                                    : item.stats?.rate >= 60 ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                  }`}
                                  style={{ width: `${item.stats?.rate}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold w-8">{item.stats?.rate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
