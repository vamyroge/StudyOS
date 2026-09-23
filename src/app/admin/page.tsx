import { requireRole } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, Shield, Activity, Flag, Database, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: questionCount },
    { count: attemptCount },
    { count: pendingSubmissions },
    { count: aiRequests },
    { count: documentCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("attempts").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }).in("status", ["pending", "flagged"]),
    supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }),
  ]);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Quản lý hệ thống và giám sát hoạt động
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tổng tài khoản</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Câu hỏi</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Trong ngân hàng</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Lượt làm bài</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attemptCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tổng attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiRequests ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Lượt gọi API</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Moderation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingSubmissions ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Chờ duyệt</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Tài liệu</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Trong kho</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quản lý nhanh</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminLink
              href="/admin/users"
              icon={<Users className="h-5 w-5" />}
              title="Người dùng"
              description="Xem và quản lý users"
            />
            <AdminLink
              href="/admin/moderation"
              icon={<Flag className="h-5 w-5" />}
              title="Kiểm duyệt"
              description={`${pendingSubmissions ?? 0} đang chờ`}
              badge={pendingSubmissions}
            />
            <AdminLink
              href="/admin/ai-usage"
              icon={<Activity className="h-5 w-5" />}
              title="AI Usage"
              description="Theo dõi API usage"
            />
            <AdminLink
              href="/admin/audit"
              icon={<Shield className="h-5 w-5" />}
              title="Audit Logs"
              description="Security audit trail"
            />
          </div>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái hệ thống</CardTitle>
            <CardDescription>Tính năng và services đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusItem label="Authentication" status="operational" />
              <StatusItem label="Database" status="operational" />
              <StatusItem label="AI Provider (xKiro)" status="operational" />
              <StatusItem label="Embedding Service" status="operational" />
              <StatusItem label="RAG Pipeline" status="operational" />
              <StatusItem label="Learning Engine" status="operational" />
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Thông tin Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>✓</strong> User management và role control</p>
            <p><strong>✓</strong> Moderation queue cho user submissions</p>
            <p><strong>✓</strong> AI usage statistics và monitoring</p>
            <p><strong>✓</strong> Audit logs cho security compliance</p>
            <p className="text-muted-foreground mt-3">
              <strong>Lưu ý:</strong> Knowledge upload sử dụng API endpoint /api/knowledge/upload
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}

function AdminLink({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number | null;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            {badge !== undefined && badge !== null && badge > 0 && (
              <Badge variant="destructive">{badge}</Badge>
            )}
          </div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-3 flex items-center text-xs text-primary">
            <span>Xem chi tiết</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatusItem({ label, status }: { label: string; status: "operational" | "degraded" | "down" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <Badge 
        variant={status === "operational" ? "success" : status === "degraded" ? "warning" : "destructive"}
      >
        {status === "operational" ? "Hoạt động" : status === "degraded" ? "Chậm" : "Lỗi"}
      </Badge>
    </div>
  );
}
