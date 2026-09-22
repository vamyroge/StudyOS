import { requireRole } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";
import Link from "next/link";
import { Users, Shield, Activity, Flag } from "lucide-react";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: questionCount },
    { count: attemptCount },
    { count: pendingSubmissions },
    { count: aiRequests },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("attempts").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }).in("status", ["pending", "flagged"]),
    supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }),
  ]);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">System management and monitoring</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Users" value={userCount ?? 0} />
          <StatCard label="Questions" value={questionCount ?? 0} />
          <StatCard label="Attempts" value={attemptCount ?? 0} />
          <StatCard label="AI Requests" value={aiRequests ?? 0} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AdminLink
            href="/admin/users"
            icon={<Users className="h-5 w-5" />}
            title="User Management"
            description="View and manage users"
          />
          <AdminLink
            href="/admin/moderation"
            icon={<Flag className="h-5 w-5" />}
            title="Moderation"
            description={`${pendingSubmissions ?? 0} pending`}
            badge={pendingSubmissions}
          />
          <AdminLink
            href="/admin/ai-usage"
            icon={<Activity className="h-5 w-5" />}
            title="AI Usage"
            description="Monitor API usage"
          />
          <AdminLink
            href="/admin/audit"
            icon={<Shield className="h-5 w-5" />}
            title="Audit Logs"
            description="Security audit trail"
          />
        </div>

        <section className="mt-8 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Admin Features</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>✓ User overview and management</li>
            <li>✓ Moderation queue for user submissions</li>
            <li>✓ AI usage statistics and cost monitoring</li>
            <li>✓ Audit logs for security and compliance</li>
            <li>○ Knowledge upload interface (use /api/knowledge/upload)</li>
            <li>○ Experiment tracking and evaluation runs</li>
          </ul>
        </section>
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
      <div className="relative rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {badge !== undefined && badge !== null && badge > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
              {badge}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
