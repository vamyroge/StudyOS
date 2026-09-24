import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trophy, Target, Calendar, TrendingUp, Filter } from "lucide-react";
import Link from "next/link";
import { QuizHistoryFilters } from "./filters";

interface SearchParams {
  subject?: string;
  difficulty?: string;
  minScore?: string;
  sort?: string;
}

export default async function QuizHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("quiz_assessments")
    .select(
      `
      *,
      subjects(name)
    `
    )
    .eq("student_id", user.id)
    .not("completed_at", "is", null);

  // Apply filters
  if (params.subject) {
    query = query.eq("subject_id", params.subject);
  }

  if (params.difficulty) {
    query = query.eq("difficulty_level", params.difficulty);
  }

  if (params.minScore) {
    query = query.gte("score", parseInt(params.minScore));
  }

  // Apply sorting
  const sortBy = params.sort || "recent";
  switch (sortBy) {
    case "highest":
      query = query.order("score", { ascending: false });
      break;
    case "lowest":
      query = query.order("score", { ascending: true });
      break;
    case "mistakes":
      query = query.order("correct_answers", { ascending: true });
      break;
    default:
      query = query.order("completed_at", { ascending: false });
  }

  const { data: quizzes } = await query.limit(50);

  // Get subjects for filter
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .order("name");

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Lịch sử Quiz
          </h1>
          <p className="mt-2 text-muted-foreground">
            Xem lại toàn bộ quiz bạn đã hoàn thành
          </p>
        </div>

        {/* Stats Summary */}
        {quizzes && quizzes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quizzes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Điểm TB
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length
                  )}
                  /100
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Độ chính xác
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    quizzes.reduce((sum, q) => sum + q.accuracy, 0) / quizzes.length
                  )}
                  %
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cao nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...quizzes.map((q) => q.score))}/100
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <QuizHistoryFilters subjects={subjects || []} currentParams={params} />

        {/* Quiz List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Danh sách Quiz
            </CardTitle>
            <CardDescription>
              {quizzes?.length || 0} kết quả
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!quizzes || quizzes.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {params.subject || params.difficulty || params.minScore
                    ? "Không tìm thấy quiz phù hợp với bộ lọc"
                    : "Bạn chưa hoàn thành quiz nào"}
                </p>
                <Link href="/quiz">
                  <Button>Làm quiz đầu tiên</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <Link key={quiz.id} href={`/quiz/result/${quiz.id}`}>
                    <div className="rounded-lg border p-4 transition-all hover:bg-muted/50 hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">
                              {quiz.subjects?.name || "Unknown Subject"}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {quiz.quiz_type === "personalized"
                                ? "Cá nhân hóa"
                                : quiz.quiz_type === "quick_assessment"
                                ? "Đánh giá nhanh"
                                : "Ôn tập chủ đề"}
                            </Badge>
                            {quiz.difficulty_level && (
                              <Badge variant="secondary" className="text-xs">
                                {quiz.difficulty_level === "basic"
                                  ? "Cơ bản"
                                  : quiz.difficulty_level === "intermediate"
                                  ? "Trung bình"
                                  : "Nâng cao"}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(quiz.completed_at).toLocaleDateString("vi-VN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {quiz.correct_answers}/{quiz.total_questions} đúng
                            </span>
                            {quiz.duration_seconds && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {Math.floor(quiz.duration_seconds / 60)}:
                                {String(quiz.duration_seconds % 60).padStart(2, "0")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold">{Math.round(quiz.score)}</div>
                          <Badge
                            variant={
                              quiz.accuracy >= 80
                                ? "success"
                                : quiz.accuracy >= 60
                                ? "warning"
                                : "destructive"
                            }
                            className="mt-1"
                          >
                            {Math.round(quiz.accuracy)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
