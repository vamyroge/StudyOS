import { requireRole } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, student_profiles(grade, subjects)")
    .order("created_at", { ascending: false })
    .limit(20);

  const studentCount = profiles?.filter(p => p.role === "STUDENT").length || 0;
  const adminCount = profiles?.filter(p => p.role === "ADMIN").length || 0;

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="mt-2 text-muted-foreground">Overview of registered users</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Total Users" value={profiles?.length || 0} />
          <StatCard label="Students" value={studentCount} />
          <StatCard label="Admins" value={adminCount} />
        </div>

        <div className="mt-8 rounded-lg border">
          <div className="border-b p-4">
            <h2 className="font-semibold">Recent Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr className="text-left text-sm">
                  <th className="p-3 font-medium">Username</th>
                  <th className="p-3 font-medium">Display Name</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Grade</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!profiles || profiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr key={profile.id} className="text-sm hover:bg-muted/30">
                      <td className="p-3 font-medium">{profile.username}</td>
                      <td className="p-3 text-muted-foreground">
                        {profile.display_name || "-"}
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          profile.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {profile.student_profiles?.[0]?.grade || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
