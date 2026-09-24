"use client";

import { Flame, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
  totalDaysStudied: number;
  hasActivityToday: boolean;
  nextMilestone?: number | null;
}

export function StreakDisplay({
  currentStreak,
  bestStreak,
  totalDaysStudied,
  hasActivityToday,
  nextMilestone,
}: StreakDisplayProps) {
  const streakColor = currentStreak >= 7 ? "text-orange-600" : currentStreak >= 3 ? "text-yellow-600" : "text-gray-600";

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${streakColor}`} />
          Chuỗi học tập
        </CardTitle>
        <CardDescription>
          {hasActivityToday ? "Bạn đã học hôm nay! 🎉" : "Hãy tiếp tục duy trì chuỗi học tập"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame className={`h-6 w-6 ${streakColor}`} />
              <span className="text-3xl font-bold">{currentStreak}</span>
              <span className="text-sm text-muted-foreground">ngày liên tiếp</span>
            </div>
            {currentStreak > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {hasActivityToday ? "Tiếp tục phát huy!" : "Học hôm nay để giữ streak!"}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-xs text-muted-foreground">Kỷ lục</p>
              <p className="text-lg font-semibold">{bestStreak} ngày</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Tổng số ngày</p>
              <p className="text-lg font-semibold">{totalDaysStudied}</p>
            </div>
          </div>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mục tiêu tiếp theo</span>
              <Badge variant="outline" className="text-xs">
                {nextMilestone} ngày
              </Badge>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${Math.min((currentStreak / nextMilestone) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">
              Còn {nextMilestone - currentStreak} ngày
            </p>
          </div>
        )}

        {/* Milestones Badges */}
        {currentStreak >= 3 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Thành tích đã đạt</p>
            <div className="flex flex-wrap gap-1">
              {[3, 7, 14, 30, 60, 100]
                .filter((m) => m <= currentStreak)
                .map((milestone) => (
                  <Badge key={milestone} variant="secondary" className="text-xs">
                    🔥 {milestone} ngày
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
