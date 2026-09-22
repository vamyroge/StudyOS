import { requireRole } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";

export default async function AuditLogsPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*, actor:profiles!actor_id(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="mt-2 text-muted-foreground">System activity and security audit trail</p>

        <div className="mt-8 rounded-lg border">
          <div className="border-b p-4">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y">
            {!auditLogs || auditLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No audit logs</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {log.action}
                        </span>
                        <span className="text-muted-foreground">
                          by {log.actor?.username || "System"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({log.actor_role})
                        </span>
                      </div>
                      {log.target_type && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Target: {log.target_type} {log.target_id && `(${log.target_id.slice(0, 8)})`}
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </p>
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
