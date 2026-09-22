import { requireRole } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const [{ count: userCount }, { count: questionCount }, { count: attemptCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("attempts").select("*", { count: "exact", head: true }),
  ]);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
      <p className="mt-2 text-muted-foreground">Admin Dashboard</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Người dùng</p>
          <p className="mt-1 text-2xl font-bold">{userCount ?? 0}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Câu hỏi</p>
          <p className="mt-1 text-2xl font-bold">{questionCount ?? 0}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Lượt làm bài</p>
          <p className="mt-1 text-2xl font-bold">{attemptCount ?? 0}</p>
        </div>
      </div>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Trạng thái quản trị</h2>
        <p className="mt-2 text-sm text-muted-foreground">Nền tảng quản trị hiện cung cấp thống kê hệ thống. Quản lý người dùng, nội dung, audit và AI usage sẽ chỉ được hiển thị sau khi có các endpoint quản trị đã kiểm thử.</p>
      </section>
      </div>
    </ProtectedLayout>
  );
}
