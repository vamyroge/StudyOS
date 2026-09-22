import { ProtectedLayout } from "@/components/protected-layout";
import { requireAuth, getProfile } from "@/lib/auth/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield, Lock, Brain } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  
  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Fetch student profile data
  const supabase = await createClient();
  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-3xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            Hồ sơ cá nhân
          </h1>
          <p className="mt-2 text-muted-foreground">
            Quản lý thông tin và cài đặt tài khoản của bạn
          </p>
        </div>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Thông tin cơ bản về tài khoản</CardDescription>
              </div>
              <Badge variant={profile.role === "ADMIN" ? "default" : "secondary"}>
                <Shield className="h-3 w-3 mr-1" />
                {profile.role === "ADMIN" ? "Quản trị" : "Học sinh"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold">{profile.display_name || profile.username}</p>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

            <div className="grid gap-4 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tham gia:</span>
                <span className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile - Using ProfileForm component */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin học tập</CardTitle>
            <CardDescription>Cập nhật thông tin để nhận gợi ý phù hợp hơn từ AI</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={studentProfile} />
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
              Kiểm soát dữ liệu cá nhân hóa cho AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Brain className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">
                    AI sử dụng thông tin của bạn như thế nào?
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    xKiro AI phân tích lịch sử học tập, điểm yếu và tiến độ của bạn để đưa ra 
                    gợi ý cá nhân hóa. Dữ liệu được mã hóa và chỉ dùng để cải thiện trải nghiệm học tập.
                  </p>
                </div>
              </div>
              
              <Link href="/settings">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Quản lý cài đặt quyền riêng tư →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
