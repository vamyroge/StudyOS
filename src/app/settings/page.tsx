import { requireAuth, getProfile } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Lock, User, Shield, Brain } from "lucide-react";
import { PrivacyForm } from "./privacy-form";
import { MistakesSection } from "./mistakes-section";

export default async function SettingsPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");
  
  const supabase = await createClient();
  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("id, privacy_settings(*)")
    .eq("user_id", user.id)
    .maybeSingle();
  
  const settings = studentProfile?.privacy_settings?.[0] || null;

  // Fetch mistakes with concept names
  const { data: mistakes } = await supabase
    .from("mistakes")
    .select(`
      id,
      error_type,
      evidence,
      created_at,
      concept_id,
      concepts(name)
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const mistakesWithConcepts = (mistakes || []).map((m: { id: string; error_type: string; evidence: string; created_at: string; concepts?: Array<{ name?: string | null }> }) => ({
    id: m.id,
    error_type: m.error_type,
    evidence: m.evidence,
    created_at: m.created_at,
    concept_name: m.concepts?.[0]?.name || null,
  }));

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Cài đặt
          </h1>
          <p className="mt-2 text-muted-foreground">
            Quản lý tài khoản và quyền riêng tư của bạn
          </p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin tài khoản
            </CardTitle>
            <CardDescription>
              Thông tin cơ bản về tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="text-sm font-medium">{user.email}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-sm text-muted-foreground">Tên người dùng</div>
                <div className="text-sm font-medium">{profile.username}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-sm text-muted-foreground">Vai trò</div>
                <Badge variant={profile.role === "ADMIN" ? "default" : "secondary"}>
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role === "ADMIN" ? "Quản trị viên" : "Học sinh"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="text-sm text-muted-foreground">Tham gia từ</div>
                <div className="text-sm font-medium">
                  {new Date(profile.created_at).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Quyền riêng tư & AI
            </CardTitle>
            <CardDescription>
              Kiểm soát dữ liệu nào được chia sẻ với xKiro AI Tutor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">AI sử dụng dữ liệu của bạn như thế nào?</p>
                  <p className="text-muted-foreground leading-relaxed">
                    xKiro AI phân tích lịch sử học tập, điểm yếu và tiến độ của bạn để đưa ra 
                    gợi ý cá nhân hóa. Dữ liệu được mã hóa và chỉ dùng để cải thiện trải nghiệm học tập.
                  </p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Lịch sử câu hỏi và câu trả lời</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Mức độ thành thạo từng concept</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Thông tin hồ sơ học tập (nếu bạn cho phép)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <PrivacyForm settings={settings} />
          </CardContent>
        </Card>

        {/* Mistakes Analysis */}
        <MistakesSection mistakes={mistakesWithConcepts} />
      </div>
    </ProtectedLayout>
  );
}
