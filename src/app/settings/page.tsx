import { requireAuth, getProfile } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { PrivacyForm } from "./privacy-form";

export default async function SettingsPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");
  const supabase = await createClient();
  const { data: studentProfile } = await supabase.from("student_profiles").select("id, privacy_settings(*)").eq("user_id", user.id).maybeSingle();
  const settings = studentProfile?.privacy_settings?.[0] || null;

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">Cài đặt</h1>
      <p className="mt-2 text-muted-foreground">Quản lý tài khoản và quyền riêng tư.</p>
      <div className="mt-8 space-y-6">
        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Thông tin tài khoản</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tên người dùng</dt>
              <dd>{profile.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Vai trò</dt>
              <dd>{profile.role}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Quyền riêng tư AI</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kiểm soát dữ liệu nào được chia sẻ với AI Tutor.
          </p>
          <PrivacyForm settings={settings} />
        </section>
      </div>
      </div>
    </ProtectedLayout>
  );
}
