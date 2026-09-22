import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";

export default async function ProgressPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: attempts }, { data: mastery }] = await Promise.all([
    supabase.from("attempts").select("*").eq("student_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("student_mastery").select("concept_id, mastery_level, last_assessed_at").eq("student_id", user.id).order("mastery_level", { ascending: false }).limit(20),
  ]);

  const totalAttempts = attempts?.length ?? 0;
  const correctAttempts = attempts?.filter((a) => a.is_correct).length ?? 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">Tiến trình học tập</h1>
      <p className="mt-2 text-muted-foreground">Theo dõi quá trình và phân tích kết quả.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Tổng lượt làm</p>
          <p className="mt-1 text-2xl font-bold">{totalAttempts}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Chính xác</p>
          <p className="mt-1 text-2xl font-bold">{accuracy}%</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Concepts đã theo dõi</p>
          <p className="mt-1 text-2xl font-bold">{mastery?.length ?? 0}</p>
        </div>
      </div>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Mức độ thành thạo</h2>
        {!mastery || mastery.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Chưa có dữ liệu. Bắt đầu luyện tập để theo dõi tiến trình.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mastery.map((m) => (
              <li key={m.concept_id} className="flex items-center gap-3">
                <span className="flex-1 text-sm font-mono">{m.concept_id.slice(0, 8)}</span>
                <div className="h-2 w-32 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${m.mastery_level * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{Math.round(m.mastery_level * 100)}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Lịch sử làm bài</h2>
        {!attempts || attempts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Chưa có lịch sử.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {attempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{a.question_id.slice(0, 8)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {a.is_correct ? "Đúng" : "Sai"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </ProtectedLayout>
  );
}
