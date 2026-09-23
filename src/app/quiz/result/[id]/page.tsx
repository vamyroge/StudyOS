import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy, TrendingUp, Clock, Target } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizReview } from "./quiz-review";

export default async function QuizResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  // Fetch assessment
  const { data: assessment } = await supabase
    .from("quiz_assessments")
    .select("*, subjects(name)")
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (!assessment) {
    notFound();
  }

  const passThreshold = 70;
  const passed = assessment.accuracy >= passThreshold;

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Result Header */}
        <Card className={`border-2 ${passed ? "border-green-500" : "border-orange-500"}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`rounded-full p-4 ${passed ? "bg-green-100 dark:bg-green-950" : "bg-orange-100 dark:bg-orange-950"}`}>
                {passed ? (
                  <Trophy className="h-12 w-12 text-green-600" />
                ) : (
                  <Target className="h-12 w-12 text-orange-600" />
                )}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {passed ? "Xuất sắc! 🎉" : "Tiếp tục cố gắng! 💪"}
                </h1>
                <p className="text-muted-foreground">
                  {passed 
                    ? "Bạn đã hoàn thành quiz với kết quả tốt"
                    : "Hãy ôn tập thêm và thử lại nhé"}
                </p>
              </div>

              <div className="text-6xl font-bold text-primary">
                {Math.round(assessment.accuracy)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Câu đúng</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {assessment.correct_answers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                / {assessment.total_questions} câu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Câu sai</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {assessment.total_questions - assessment.correct_answers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                / {assessment.total_questions} câu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Thời gian</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessment.duration_seconds 
                  ? `${Math.floor(assessment.duration_seconds / 60)}:${String(assessment.duration_seconds % 60).padStart(2, '0')}`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                phút:giây
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Điểm số</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(assessment.score)}/100
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {assessment.difficulty_level === "basic" ? "Cơ bản" :
                 assessment.difficulty_level === "intermediate" ? "Trung bình" :
                 assessment.difficulty_level === "advanced" ? "Nâng cao" : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Đề xuất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {passed ? (
              <>
                <p className="text-sm">
                  ✅ Bạn đã nắm vững kiến thức ở mức độ này. Hãy thử thách bản thân với mức độ cao hơn!
                </p>
                <Link href="/quiz">
                  <Button>Làm quiz mới</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm">
                  📚 Bạn nên ôn tập lại các chủ đề đã sai. Đừng lo lắng, mọi người đều cần thời gian để học!
                </p>
                <div className="flex gap-2">
                  <Link href="/tutor">
                    <Button>Hỏi AI Tutor</Button>
                  </Link>
                  <Link href="/quiz">
                    <Button variant="outline">Thử lại</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quiz Review - Detailed Questions */}
        <QuizReview assessmentId={id} />

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="outline">Về Dashboard</Button>
          </Link>
          <Link href="/quiz">
            <Button>Quiz mới</Button>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  );
}
