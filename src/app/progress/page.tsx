import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, BookOpen, Brain, AlertCircle, Calendar, Award, ThumbsUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStudentStrengths, getStudentWeaknesses, getImprovementRecords, getTrendBadge } from "@/lib/learning/strength-weakness";
import { getRecentQuizPerformance, getSubjectPerformance, getOverallPerformance } from "@/lib/dashboard/analytics";
import { getTopicMastery } from "@/lib/dashboard/service";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { formatPercentage, formatScore } from "@/lib/utils";

export default async function ProgressPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // PHASE 10: Enhanced analytics data
  const [
    { data: attempts },
    { data: mastery },
    strengths,
    weaknesses,
    improvements,
    recentPerformance,
    subjectPerformance,
    overallPerformance,
    topicMastery,
  ] = await Promise.all([
    supabase.from("attempts").select("*").eq("student_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("student_mastery").select("concept_id, mastery_level, last_assessed_at").eq("student_id", user.id).order("mastery_level", { ascending: false }),
    getStudentStrengths(user.id, 10),
    getStudentWeaknesses(user.id, 10),
    getImprovementRecords(user.id, 10),
    getRecentQuizPerformance(user.id, 14),
    getSubjectPerformance(user.id),
    getOverallPerformance(user.id),
    getTopicMastery(user.id),
  ]);

  const totalAttempts = attempts?.length ?? 0;
  const correctAttempts = attempts?.filter((a) => a.is_correct).length ?? 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  const masteredCount = mastery?.filter((m) => m.mastery_level >= 0.8).length ?? 0;
  const needsReviewCount = mastery?.filter((m) => m.mastery_level < 0.5).length ?? 0;

  // Note: Subject breakdown requires join queries which may not work perfectly with current schema
  const subjectStats: Array<{id: string; name: string; attempts: number; accuracy: number; masteryCount: number; weakCount: number}> = [];

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Tiến trình học tập
          </h1>
          <p className="mt-2 text-muted-foreground">
            Theo dõi quá trình và phân tích kết quả của bạn
          </p>
        </div>

        {/* PHASE 10: Enhanced Overall Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Tổng quiz</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallPerformance.totalQuizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overallPerformance.totalQuestions} câu hỏi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Độ chính xác TB</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(overallPerformance.averageAccuracy)}</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: overallPerformance.averageAccuracy !== null ? `${overallPerformance.averageAccuracy}%` : "0%" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Điểm cao nhất</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overallPerformance.bestScore !== null ? Math.round(overallPerformance.bestScore) : "Chưa có dữ liệu"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                / {overallPerformance.worstScore !== null ? overallPerformance.worstScore : "N/A"} thấp nhất
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Xu hướng</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {overallPerformance.improvementRate !== null ? (
                <>
                  <div className={`text-2xl font-bold ${overallPerformance.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overallPerformance.improvementRate >= 0 ? '+' : ''}{Math.round(overallPerformance.improvementRate)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overallPerformance.improvementRate >= 0 ? 'Đang tiến bộ' : 'Cần cải thiện'}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-muted-foreground">Chưa có dữ liệu</div>
                  <p className="text-xs text-muted-foreground mt-1">Cần ít nhất 6 quiz để so sánh</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PHASE 10: Performance Chart */}
        <PerformanceChart data={recentPerformance} />

        {/* PHASE 10: Subject Performance */}
        {subjectPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tiến trình theo môn học</CardTitle>
              <CardDescription>Phân tích chi tiết từng môn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectPerformance.map((subject) => {
                  const getTrendIcon = () => {
                    if (subject.trend === 'improving') return '📈';
                    if (subject.trend === 'declining') return '📉';
                    return '➡️';
                  };
                  
                  return (
                    <div key={subject.subjectId} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{subject.subjectName}</h3>
                            <span>{getTrendIcon()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {subject.totalQuizzes} quiz • {subject.correctAnswers}/{subject.totalQuestions} đúng
                          </p>
                        </div>
                        <Badge variant={subject.averageAccuracy >= 70 ? "success" : subject.averageAccuracy >= 50 ? "warning" : "destructive"}>
                          {Math.round(subject.averageAccuracy)}%
                        </Badge>
                      </div>
                      <Progress value={subject.averageAccuracy} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PHASE 10: Strengths & Weaknesses */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Điểm mạnh
                </CardTitle>
                <CardDescription>
                  Topics bạn đang thể hiện tốt
                </CardDescription>
              </CardHeader>
              <CardContent>
                {strengths.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Làm thêm quiz để xác định điểm mạnh
                  </p>
                ) : (
                  <div className="space-y-3">
                    {strengths.map((strength) => {
                      const trendBadge = getTrendBadge(strength.trend);
                      return (
                        <div key={strength.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{strength.topicName}</p>
                                <span className="text-xs">{trendBadge.icon}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {strength.subjectName} • {strength.correctAttempts}/{strength.totalAttempts}
                              </p>
                            </div>
                            <Badge variant="success">{Math.round(strength.recentAccuracy * 100)}%</Badge>
                          </div>
                          <Progress value={strength.recentAccuracy * 100} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Cần cải thiện
                </CardTitle>
                <CardDescription>
                  Topics cần tập trung ôn luyện
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weaknesses.length === 0 ? (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm text-green-900 dark:text-green-100">
                    🎉 Tuyệt vời! Không có điểm yếu rõ rệt
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weaknesses.map((weakness) => {
                      const trendBadge = getTrendBadge(weakness.trend);
                      return (
                        <div key={weakness.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{weakness.topicName}</p>
                                <span className="text-xs">{trendBadge.icon}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {weakness.subjectName} • {weakness.correctAttempts}/{weakness.totalAttempts}
                              </p>
                            </div>
                            <Badge variant="destructive">{Math.round(weakness.recentAccuracy * 100)}%</Badge>
                          </div>
                          <Progress value={weakness.recentAccuracy * 100} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subject Breakdown */}
        {subjectStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tiến trình theo môn học</CardTitle>
              <CardDescription>Phân tích chi tiết từng môn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectStats.map((subject) => (
                  <div key={subject.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{subject.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {subject.attempts} câu đã làm
                        </p>
                      </div>
                      <Badge variant={subject.accuracy >= 70 ? "success" : subject.accuracy >= 50 ? "warning" : "destructive"}>
                        {subject.accuracy}% chính xác
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Thành thạo:</span>
                        <span className="font-medium">{subject.masteryCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-muted-foreground">Cần ôn:</span>
                        <span className="font-medium">{subject.weakCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mastery Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Mức độ thành thạo
              </CardTitle>
              <CardDescription>
                Top concepts theo thứ tự thành thạo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!mastery || mastery.length === 0 ? (
                <EmptyState 
                  message="Chưa có dữ liệu mastery. Bắt đầu luyện tập để theo dõi tiến trình." 
                  href="/questions"
                />
              ) : (
                <div className="space-y-3">
                  {mastery.slice(0, 10).map((m) => (
                    <div key={m.concept_id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate flex-1 font-mono">
                          {m.concept_id.slice(0, 12)}
                        </span>
                        <Badge 
                          variant={m.mastery_level >= 0.8 ? "success" : m.mastery_level >= 0.5 ? "warning" : "destructive"}
                          className="ml-2"
                        >
                          {Math.round(m.mastery_level * 100)}%
                        </Badge>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            m.mastery_level >= 0.8 
                              ? "bg-green-600" 
                              : m.mastery_level >= 0.5 
                              ? "bg-yellow-600" 
                              : "bg-red-600"
                          }`}
                          style={{ width: `${m.mastery_level * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Hoạt động gần đây
              </CardTitle>
              <CardDescription>
                20 lần làm bài gần nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!attempts || attempts.length === 0 ? (
                <EmptyState 
                  message="Chưa có lịch sử làm bài." 
                  href="/questions"
                />
              ) : (
                <div className="space-y-2">
                  {attempts.slice(0, 20).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-muted-foreground truncate">
                          #{a.question_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(a.created_at).toLocaleString("vi-VN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <Badge variant={a.is_correct ? "success" : "destructive"}>
                        {a.is_correct ? "Đúng" : "Sai"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function EmptyState({ message, href }: { message: string; href: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      <Link href={href} className="mt-4">
        <Button variant="outline" size="sm">
          Bắt đầu luyện tập →
        </Button>
      </Link>
    </div>
  );
}
