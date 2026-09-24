import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy, TrendingUp, Clock, Target, Brain, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizReview } from "./quiz-review";
import { analyzeQuizResult, getPerformanceBadge, type QuizResultAnalysis } from "@/lib/quiz/analysis";
import { getQuizRecommendations, type QuizRecommendation } from "@/lib/quiz/recommendations";
import { RecommendationsCard } from "@/components/quiz/recommendations-card";

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

  // Fetch analysis and recommendations concurrently with resilient fallbacks
  const [analysisResult, recommendationsResult] = await Promise.allSettled([
    analyzeQuizResult(id, user.id),
    getQuizRecommendations(id),
  ]);

  const defaultAnalysis: QuizResultAnalysis = {
    performance: assessment.accuracy >= 80 ? "strong" : assessment.accuracy >= 60 ? "average" : "weak",
    performanceMessage: assessment.accuracy >= 80
      ? "Bạn đang làm rất tốt ở chủ đề này. Hãy tiếp tục duy trì!"
      : assessment.accuracy >= 60
      ? "Kiến thức đã khá ổn nhưng vẫn còn một số điểm cần củng cố."
      : "Bạn nên ôn lại chủ đề này trước khi làm quiz tiếp theo.",
    performanceColor: assessment.accuracy >= 80 ? "text-green-600" : assessment.accuracy >= 60 ? "text-yellow-600" : "text-red-600",
    topicBreakdown: [],
    skillTags: [],
    comparisonToAverage: null,
  };

  const analysis: QuizResultAnalysis =
    analysisResult.status === "fulfilled" ? analysisResult.value : defaultAnalysis;

  const recommendations: QuizRecommendation[] =
    recommendationsResult.status === "fulfilled" ? recommendationsResult.value : [];

  const passThreshold = 70;
  const passed = assessment.accuracy >= passThreshold;

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Result Header */}
        <Card className={`border-2 ${passed ? "border-green-500 shadow-green-100 dark:shadow-none" : "border-orange-500"}`}>
          <CardContent className="pt-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className={`rounded-full p-6 ${passed ? "bg-green-100 dark:bg-green-950 shadow-lg shadow-green-200/50" : "bg-orange-100 dark:bg-orange-950 shadow-lg shadow-orange-200/50"}`}>
                {passed ? (
                  <Trophy className="h-16 w-16 text-green-600" />
                ) : (
                  <Target className="h-16 w-16 text-orange-600" />
                )}
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {passed ? "Xuất sắc!" : "Bạn đã hoàn thành quiz!"}
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  {passed 
                    ? "Rất tuyệt vời! Bạn đã làm rất tốt với chủ đề này."
                    : "Không sao đâu! Học tập là một hành trình - tiếp tục cố gắng nhé!"}
                </p>
              </div>

              <div className="text-7xl font-bold text-primary tracking-tighter">
                {Math.round(assessment.accuracy)}%
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">{assessment.subjects?.name || "Môn học"} • {assessment.quiz_type === "personalized" ? "Cá nhân hóa" : "Ôn tập chủ đề"}</span>
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
              <div className="text-3xl font-bold text-green-600">
                {assessment.correct_answers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                / {assessment.total_questions} câu • {Math.round(assessment.accuracy)}%
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
              <div className="text-3xl font-bold text-red-600">
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
              <div className="text-3xl font-bold">
                {assessment.duration_seconds 
                  ? `${Math.floor(assessment.duration_seconds / 60)}:${String(assessment.duration_seconds % 60).padStart(2, '0')}`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {assessment.duration_seconds ? "phút:giây" : "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Độ khó</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-xl font-medium">
                {assessment.difficulty_level === "basic" ? "Cơ bản" :
                 assessment.difficulty_level === "intermediate" ? "Trung bình" :
                 assessment.difficulty_level === "advanced" ? "Nâng cao" : "Chưa xác định"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {assessment.difficulty_level === "basic" ? "Dành cho người mới" :
                 assessment.difficulty_level === "intermediate" ? "Trình độ trung bình" :
                 assessment.difficulty_level === "advanced" ? "Dành cho người giỏi" : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className={`border-l-4 ${
          analysis.performance === 'strong' ? 'border-l-green-500' :
          analysis.performance === 'average' ? 'border-l-yellow-500' :
          'border-l-red-500'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Đánh giá tổng quan
            </CardTitle>
            <CardDescription>
              Phân tích chi tiết kết quả quiz của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`text-5xl flex-shrink-0 ${
                analysis.performance === 'strong' ? 'text-green-600' :
                analysis.performance === 'average' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {analysis.performance === 'strong' ? '🎯' :
                 analysis.performance === 'average' ? '📊' : '📚'}
              </div>
              <div className="flex-1 space-y-3">
                <h3 className={`text-2xl font-semibold ${analysis.performanceColor}`}>
                  {analysis.performance === 'strong' ? 'Xuất sắc!' :
                   analysis.performance === 'average' ? 'Khá tốt!' : 'Cần cải thiện'}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {analysis.performanceMessage}
                </p>
                
                {analysis.comparisonToAverage && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm font-medium mb-3">So sánh với trung bình lớp</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Của bạn</p>
                        <p className="text-xl font-bold">{analysis.comparisonToAverage.yourScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trung bình</p>
                        <p className="text-xl font-bold text-blue-600">{analysis.comparisonToAverage.classAverage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Xếp hạng</p>
                        <p className="text-xl font-bold text-purple-600">Top {100 - analysis.comparisonToAverage.percentile}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Breakdown */}
        {analysis.topicBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Phân tích theo chủ đề
              </CardTitle>
              <CardDescription>
                Chi tiết kết quả từng chủ đề trong quiz này
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.topicBreakdown.map((topic) => {
                const badge = getPerformanceBadge(topic.performance);
                return (
                  <div key={topic.topicId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{topic.topicName}</span>
                          <Badge variant={badge.variant} className="text-xs px-2 py-0.5">
                            {badge.icon} {badge.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {topic.questionsCorrect}/{topic.questionsAttempted} câu đúng
                        </p>
                      </div>
                      <span className="text-2xl font-bold">{Math.round(topic.accuracy)}%</span>
                    </div>
                    <Progress value={topic.accuracy} className="h-2.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <RecommendationsCard recommendations={recommendations} />
        )}

        {/* Quiz Review - Detailed Questions */}
        <QuizReview assessmentId={id} />

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="outline">Về Dashboard</Button>
          </Link>
          <Link href="/quiz">
            <Button>Làm quiz mới</Button>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  );
}
