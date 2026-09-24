"use client";

import { SubjectPerformance } from "@/lib/dashboard/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SubjectPerformanceCardProps {
  subjects: SubjectPerformance[];
}

export function SubjectPerformanceCard({ subjects }: SubjectPerformanceCardProps) {
  if (subjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Kết quả theo môn học
          </CardTitle>
          <CardDescription>Chưa có dữ liệu</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Hoàn thành quiz để xem phân tích theo môn
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Kết quả theo môn học
        </CardTitle>
        <CardDescription>Phân tích chi tiết từng môn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.map((subject) => {
          const getTrendIcon = () => {
            if (subject.trend === "improving")
              return <TrendingUp className="h-4 w-4 text-green-600" />;
            if (subject.trend === "declining")
              return <TrendingDown className="h-4 w-4 text-red-600" />;
            return <Minus className="h-4 w-4 text-blue-600" />;
          };

          const getTrendColor = () => {
            if (subject.trend === "improving") return "text-green-600";
            if (subject.trend === "declining") return "text-red-600";
            return "text-blue-600";
          };

          const getAccuracyBadge = () => {
            if (subject.averageAccuracy >= 80) return "success";
            if (subject.averageAccuracy >= 60) return "warning";
            return "destructive";
          };

          return (
            <div key={subject.subjectId} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{subject.subjectName}</h3>
                    {getTrendIcon()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subject.totalQuizzes} quiz • {subject.correctAnswers}/{subject.totalQuestions} câu đúng
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={getAccuracyBadge() as any} className="mb-1">
                    {Math.round(subject.averageAccuracy)}%
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    TB: {Math.round(subject.averageScore)}/100
                  </p>
                </div>
              </div>

              <Progress value={subject.averageAccuracy} className="h-2" />

              <div className="flex items-center justify-between text-xs">
                <span className={getTrendColor()}>
                  {subject.trend === "improving" && "📈 Đang tiến bộ"}
                  {subject.trend === "declining" && "📉 Cần chú ý"}
                  {subject.trend === "stable" && "➡️ Ổn định"}
                </span>
                {subject.lastQuizDate && (
                  <span className="text-muted-foreground">
                    Quiz gần nhất:{" "}
                    {new Date(subject.lastQuizDate).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
