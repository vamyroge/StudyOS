import { requireAuth, getProfile } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProtectedLayout } from "@/components/protected-layout";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">Hồ sơ</h1>
      <p className="mt-2 text-muted-foreground">Thông tin cá nhân và học tập.</p>

      <div className="mt-8 space-y-6">
        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Thông tin cơ bản</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tên người dùng</dt>
              <dd>{profile.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tên hiển thị</dt>
              <dd>{profile.display_name || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Vai trò</dt>
              <dd>{profile.role}</dd>
            </div>
          </dl>
        </section>

        {studentProfile && (
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Thông tin học tập</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lớp</dt>
                <dd>{studentProfile.grade}</dd>
              </div>
              {studentProfile.class_name && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Lớp học</dt>
                  <dd>{studentProfile.class_name}</dd>
                </div>
              )}
              {studentProfile.target_exam && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Kỳ thi mục tiêu</dt>
                  <dd>{studentProfile.target_exam}</dd>
                </div>
              )}
            </dl>
          </section>
        )}
        <ProfileForm profile={profile} studentProfile={studentProfile} />
      </div>
      </div>
    </ProtectedLayout>
  );
}
