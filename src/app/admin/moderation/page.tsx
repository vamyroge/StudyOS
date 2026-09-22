import { requireRole } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import { ModerationActions } from "./moderation-actions";

export default async function ModerationPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, submitter:profiles!submitter_id(username)")
    .in("status", ["pending", "flagged"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold">Moderation Queue</h1>
        <p className="mt-2 text-muted-foreground">Review and moderate user submissions</p>

        {!submissions || submissions.length === 0 ? (
          <div className="mt-8 rounded-lg border p-8 text-center text-muted-foreground">
            <p>No pending submissions.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        submission.status === "flagged" 
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {submission.status}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        by {submission.submitter?.username || "Unknown"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium">{submission.target_type}</p>
                      <p className="text-xs text-muted-foreground font-mono">{submission.target_id}</p>
                      {submission.source && (
                        <p className="mt-1 text-xs text-muted-foreground">Source: {submission.source}</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Submitted {new Date(submission.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <ModerationActions submissionId={submission.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
