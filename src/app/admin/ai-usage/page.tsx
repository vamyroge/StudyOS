import { requireRole } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";

export default async function AIUsagePage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const { data: usageLogs } = await supabase
    .from("ai_usage_logs")
    .select("*, user:profiles!user_id(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  const totalTokens = usageLogs?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0;
  const successCount = usageLogs?.filter(log => log.status === "success").length || 0;
  const errorCount = usageLogs?.filter(log => log.status === "error").length || 0;

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold">AI Usage Statistics</h1>
        <p className="mt-2 text-muted-foreground">Monitor AI API usage and costs</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Total Requests" value={usageLogs?.length || 0} />
          <StatCard label="Success" value={successCount} />
          <StatCard label="Errors" value={errorCount} />
          <StatCard label="Total Tokens" value={totalTokens.toLocaleString()} />
        </div>

        <div className="mt-8 rounded-lg border">
          <div className="border-b p-4">
            <h2 className="font-semibold">Recent Requests</h2>
          </div>
          <div className="divide-y">
            {!usageLogs || usageLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No usage data</div>
            ) : (
              usageLogs.slice(0, 50).map((log) => (
                <div key={log.id} className="p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          log.status === "success" 
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {log.status}
                        </span>
                        <span className="font-medium">{log.request_type}</span>
                        <span className="text-muted-foreground">{log.provider}/{log.model}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>User: {log.user?.username || "Unknown"}</span>
                        <span>Tokens: {log.total_tokens || 0}</span>
                        <span>Latency: {log.latency_ms || 0}ms</span>
                        <span>{new Date(log.created_at).toLocaleString("vi-VN")}</span>
                      </div>
                      {log.error && (
                        <p className="mt-1 text-xs text-red-600">{log.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
