import { requireAuth, getProfile } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";

export async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar username={profile.username} role={profile.role} />
      <main className="flex-1 lg:ml-64">
        {/* Mobile spacer */}
        <div className="h-16 lg:hidden" />
        {children}
      </main>
    </div>
  );
}
