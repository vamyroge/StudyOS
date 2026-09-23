import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, AlertCircle, Send } from "lucide-react";
import { ContributionForm } from "./contribution-form";

export default async function KnowledgePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: contributions }, { data: subjects }] = await Promise.all([
    supabase.from("submissions").select("id, target_id, status, source, created_at").eq("submitter_id", user.id).eq("target_type", "knowledge_contribution").order("created_at", { ascending: false }).limit(50),
    supabase.from("subjects").select("id, name").order("name"),
  ]);
  const totalContributions = contributions?.length ?? 0;
  const pendingContributions = contributions?.filter((item) => item.status === "pending" || item.status === "flagged").length ?? 0;
  const approvedContributions = contributions?.filter((item) => item.status === "approved").length ?? 0;
  const rejectedContributions = contributions?.filter((item) => item.status === "rejected").length ?? 0;

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Kho kiến thức
            </h1>
            <p className="mt-2 text-muted-foreground">Đóng góp kiến thức để cộng đồng học tốt hơn. Mọi đóng góp đều cần được kiểm duyệt.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đóng góp của bạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContributions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đang chờ duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingContributions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đã duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedContributions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Không được duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedContributions}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Gửi đóng góp kiến thức</CardTitle></CardHeader>
          <CardContent>
            <ContributionForm subjects={subjects || []} />
          </CardContent>
        </Card>

        {/* Contribution status */}
        <div className="space-y-3">
          {!contributions || contributions.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Chưa có đóng góp nào</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  Hãy gửi ghi chú hoặc tóm tắt có nguồn rõ ràng. Nội dung sẽ chỉ được dùng sau khi admin phê duyệt.
                </p>
              </div>
            </Card>
          ) : (
            contributions.map((contribution) => (
              <Card key={contribution.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold truncate">Đóng góp kiến thức</h3>
                        <Badge
                          variant={
                            contribution.status === "approved" ? "success"
                            : contribution.status === "rejected" ? "destructive"
                            : "secondary"
                          }
                        >
                          {contribution.status === "approved" ? "Đã duyệt" : contribution.status === "rejected" ? "Không được duyệt" : contribution.status === "flagged" ? "Cần bổ sung" : "Chờ duyệt"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {contribution.source ? `Nguồn: ${contribution.source}` : "Chưa cung cấp nguồn"}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contribution.created_at).toLocaleDateString("vi-VN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Hướng dẫn sử dụng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Quy trình:</strong> Gửi nội dung → admin kiểm duyệt → chỉ nội dung được duyệt mới có thể được đưa vào kho kiến thức.
            </p>
            <p>
              <strong>Provenance:</strong> Nguồn do bạn khai báo luôn được lưu cùng submission và moderation audit trail.
            </p>
            <p>
              <strong>Lưu ý:</strong> Không gửi thông tin cá nhân, nội dung có bản quyền không được phép chia sẻ, hoặc tài liệu không rõ nguồn.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
