import { requireAuth } from "@/lib/auth/utils";
import { getStudentStats, getStudentMastery, getRecommendations } from "@/lib/dashboard/service";
import { ProtectedLayout } from "@/components/protected-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Target, TrendingUp, AlertCircle, MessageCircle } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();
  const stats = await getStudentStats(user.id);
  const mastery = await getStudentMastery(user.id);
  const recommendations = await getRecommendations(user.id);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Tổng quan tiến trình học tập</p>
          </div>
          <Link href="/questions">
            <Button>Luyện tập ngay</Button>
          </Link>
        </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Câu đã làm" value={stats.totalAttempts} />
        <StatCard icon={<Target className="h-5 w-5" />} label="Chính xác" value={`${stats.accuracy}%`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Concepts mastered" value={mastery.filter((m) => m.mastery_level >= 0.8).length} />
        <StatCard icon={<Brain className="h-5 w-5" />} label="Cần ôn tập" value={mastery.filter((m) => m.mastery_level < 0.5).length} />
      </div>

      <section className="mt-8 rounded-lg border bg-muted/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Học cùng xKiro AI</h2>
              <p className="mt-1 text-sm text-muted-foreground">Hỏi bài, xin gợi ý từng bước, hoặc lập kế hoạch ôn tập theo mục tiêu của bạn.</p>
            </div>
          </div>
          <Link href="/tutor">
            <Button>Trò chuyện với xKiro AI</Button>
          </Link>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lần làm gần đây
          </h2>
          {stats.recentAttempts.length === 0 ? (
            <EmptyState message="Chưa có bài làm nào. Bắt đầu luyện tập!" href="/questions" />
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.recentAttempts.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{attempt.question_id.slice(0, 8)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${attempt.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {attempt.is_correct ? "Đúng" : "Sai"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Gợi ý học tập
          </h2>
          {recommendations.length === 0 ? (
            <EmptyState message="Chưa có gợi ý. Tiếp tục luyện tập để nhận đề xuất!" href="/questions" />
          ) : (
            <ul className="mt-4 space-y-2">
              {recommendations.map((rec) => (
                <li key={rec.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{rec.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{rec.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </div>
    </ProtectedLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ message, href }: { message: string; href: string }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
      <p className="text-sm">{message}</p>
      <Link href={href}>
        <Button variant="link" className="mt-2 text-sm">Bắt đầu</Button>
      </Link>
    </div>
  );
}
