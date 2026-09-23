import { requireAuth, getProfile } from "@/lib/auth/utils";
import { getStudentStats, getStudentMastery, getRecommendations, getTopicMastery } from "@/lib/dashboard/service";
import { Sidebar } from "@/components/sidebar";
import { LoadingLink } from "@/components/ui/loading-link";
import { PageLoaded } from "@/components/page-loaded";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Brain, Target, AlertCircle, MessageCircle, TrendingUp, Sparkles, Award, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();
  const stats = await getStudentStats(user.id);
  const mastery = await getStudentMastery(user.id);
  const recommendations = await getRecommendations(user.id);
  const topicMastery = await getTopicMastery(user.id);
  const profile = await getProfile(user.id);

  const masteredCount = mastery.filter((m) => m.mastery_level >= 0.8).length;
  const needsReviewCount = mastery.filter((m) => m.mastery_level < 0.5).length;
  
  // Get strong and weak topics from topic_mastery
  const strongTopics = topicMastery.filter(t => t.masteryScore >= 0.7).slice(-5).reverse();
  const weakTopics = topicMastery.filter(t => t.masteryScore < 0.6).slice(0, 5);

  return (
    <div className="flex min-h-screen">
      <PageLoaded />
      <Sidebar username={profile?.username || user.email || "User"} role={profile?.role || "STUDENT"} />
      
      <main className="flex-1 lg:ml-64">
        {/* Mobile spacer */}
        <div className="h-16 lg:hidden" />
        
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Xin chào, {profile?.display_name || profile?.username} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Hãy tiếp tục hành trình học tập của bạn hôm nay
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">Tổng câu đã làm</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAttempts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString("vi-VN", { day: "numeric", month: "long" })}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">Độ chính xác</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.accuracy}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.correctAttempts}/{stats.totalAttempts} câu đúng
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">Quiz đã làm</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.quizzesTaken}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Điểm TB: {stats.averageQuizScore}/100
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">Chuỗi học tập</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.studyStreak} 🔥</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.conversationsCount} hội thoại
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Tutor CTA */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      Học cùng xKiro AI
                      <Sparkles className="h-4 w-4 text-primary" />
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hỏi bài, xin gợi ý từng bước, hoặc lập kế hoạch ôn tập cá nhân hóa
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col lg:flex-row">
                  <LoadingLink href="/tutor">
                    <Button className="w-full sm:w-auto">Trò chuyện ngay</Button>
                  </LoadingLink>
                  <LoadingLink href="/questions">
                    <Button variant="outline" className="w-full sm:w-auto">Luyện tập</Button>
                  </LoadingLink>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Attempts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Lần làm gần đây
                </CardTitle>
                <CardDescription>
                  Lịch sử hoạt động của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentAttempts.length === 0 ? (
                  <EmptyState 
                    message="Chưa có bài làm nào. Bắt đầu luyện tập để theo dõi tiến trình!" 
                    href="/questions"
                    ctaText="Bắt đầu luyện tập"
                  />
                ) : (
                  <div className="space-y-3">
                    {stats.recentAttempts.slice(0, 5).map((attempt) => (
                      <div 
                        key={attempt.id} 
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono truncate">
                            #{attempt.question_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attempt.created_at).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short"
                            })}
                          </p>
                        </div>
                        <Badge variant={attempt.is_correct ? "success" : "destructive"}>
                          {attempt.is_correct ? "Đúng" : "Sai"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Gợi ý học tập
                </CardTitle>
                <CardDescription>
                  Dựa trên phân tích của AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <EmptyState 
                    message="Tiếp tục luyện tập để nhận gợi ý cá nhân hóa từ AI!" 
                    href="/questions"
                    ctaText="Luyện tập ngay"
                  />
                ) : (
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec) => (
                      <div 
                        key={rec.id} 
                        className="rounded-lg border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                      >
                        <p className="text-sm font-medium">{rec.action}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Topics Mastery Section */}
          {topicMastery.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Strong Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    Topic mạnh
                  </CardTitle>
                  <CardDescription>
                    Các chủ đề bạn đã nắm vững
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {strongTopics.length === 0 ? (
                    <EmptyState 
                      message="Hoàn thành quiz để xem topic bạn đã nắm vững!" 
                      href="/quiz"
                      ctaText="Làm quiz"
                    />
                  ) : (
                    <div className="space-y-4">
                      {strongTopics.map((topic) => (
                        <div key={topic.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {topic.topicName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {topic.subjectName} • {topic.questionsAttempted} câu đã làm
                              </p>
                            </div>
                            <Badge variant="success" className="ml-2">
                              {Math.round(topic.masteryScore * 100)}%
                            </Badge>
                          </div>
                          <Progress value={topic.masteryScore * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weak Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Topic cần ôn
                  </CardTitle>
                  <CardDescription>
                    Các chủ đề cần tập trung ôn luyện
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {weakTopics.length === 0 ? (
                    <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm text-green-900 dark:text-green-100">
                      🎉 Tuyệt vời! Bạn không có topic nào cần ôn. Hãy tiếp tục duy trì!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {weakTopics.map((topic) => (
                        <div key={topic.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {topic.topicName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {topic.subjectName} • {topic.questionsCorrect}/{topic.questionsAttempted} đúng
                              </p>
                            </div>
                            <Badge variant="destructive" className="ml-2">
                              {Math.round(topic.masteryScore * 100)}%
                            </Badge>
                          </div>
                          <Progress value={topic.masteryScore * 100} className="h-2" />
                        </div>
                      ))}
                      <LoadingLink href="/tutor" className="block">
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          <Brain className="h-4 w-4 mr-2" />
                          Hỏi AI Tutor về topics này
                        </Button>
                      </LoadingLink>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ message, href, ctaText }: { message: string; href: string; ctaText: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      <LoadingLink href={href} className="mt-4">
        <Button variant="outline" size="sm">
          {ctaText} →
        </Button>
      </LoadingLink>
    </div>
  );
}
