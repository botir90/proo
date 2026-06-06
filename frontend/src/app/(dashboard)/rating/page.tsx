'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Medal, Star, Award, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useState } from 'react';

const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const RANK_BG    = ['bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                    'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700',
                    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
}

function PointsBadge({ points }: { points: number }) {
  if (points >= 100) return <Badge className="bg-yellow-500 text-white gap-1"><Star className="w-3 h-3" />{points} ball</Badge>;
  if (points >= 50)  return <Badge className="bg-violet-500 text-white gap-1"><Award className="w-3 h-3" />{points} ball</Badge>;
  if (points >= 10)  return <Badge className="bg-blue-500 text-white gap-1">{points} ball</Badge>;
  return <Badge variant="secondary">{points} ball</Badge>;
}

export default function RatingPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isTeacher = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'].includes(user?.role || '');

  const { data, isLoading } = useQuery({
    queryKey: ['students-rating'],
    queryFn: () => api.get('/students/rating/leaderboard'),
  });

  const students: any[] = data?.data?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const top3    = students.slice(0, 3);
  const theRest = students.slice(3);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">O'quvchilar reytingi</h1>
          <p className="text-sm text-muted-foreground">Vazifa bajarish bo'yicha umumiy reyting</p>
        </div>
      </div>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {/* 2nd place */}
          <div className="flex flex-col items-center gap-2 pt-6">
            {top3[1] && (
              <>
                <Avatar className="w-14 h-14 ring-2 ring-gray-300">
                  <AvatarImage src={getAvatarUrl(top3[1]?.user?.avatar)} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 font-bold">
                    {getInitials(top3[1]?.user?.firstName, top3[1]?.user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <Medal className="w-6 h-6 text-gray-400" />
                <p className="text-xs font-semibold text-center leading-tight">
                  {top3[1]?.user?.firstName} {top3[1]?.user?.lastName}
                </p>
                <PointsBadge points={top3[1]?.totalPoints} />
              </>
            )}
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center gap-2">
            {top3[0] && (
              <>
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-4 ring-yellow-400 shadow-lg">
                    <AvatarImage src={getAvatarUrl(top3[0]?.user?.avatar)} />
                    <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold text-xl">
                      {getInitials(top3[0]?.user?.firstName, top3[0]?.user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                </div>
                <Trophy className="w-7 h-7 text-yellow-500" />
                <p className="text-sm font-bold text-center leading-tight">
                  {top3[0]?.user?.firstName} {top3[0]?.user?.lastName}
                </p>
                <PointsBadge points={top3[0]?.totalPoints} />
              </>
            )}
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center gap-2 pt-10">
            {top3[2] && (
              <>
                <Avatar className="w-12 h-12 ring-2 ring-amber-400">
                  <AvatarImage src={getAvatarUrl(top3[2]?.user?.avatar)} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                    {getInitials(top3[2]?.user?.firstName, top3[2]?.user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <Medal className="w-6 h-6 text-amber-600" />
                <p className="text-xs font-semibold text-center leading-tight">
                  {top3[2]?.user?.firstName} {top3[2]?.user?.lastName}
                </p>
                <PointsBadge points={top3[2]?.totalPoints} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Full leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Barcha o'quvchilar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          {students.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Hali ball berilmagan</p>
          )}
          {students.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                i < 3 ? RANK_BG[i] : 'hover:bg-muted/50'
              }`}
            >
              <div className="w-8 flex justify-center shrink-0">
                <RankIcon rank={i + 1} />
              </div>
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={getAvatarUrl(s.user?.avatar)} />
                <AvatarFallback className={`text-xs font-bold ${i < 3 ? RANK_COLORS[i] : ''}`}>
                  {getInitials(s.user?.firstName, s.user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {s.user?.firstName} {s.user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {s._count?.homeworkSubmissions ?? 0} ta vazifa bajarilgan
                </p>
              </div>
              <PointsBadge points={s.totalPoints} />
            </div>
          ))}
        </CardContent>
      </Card>

      {students.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hali hech kim ball olmagan</p>
          <p className="text-sm mt-1">Ustoz vazifa bajargan o'quvchiga ball berganida bu yerda ko'rinadi</p>
        </div>
      )}
    </div>
  );
}
