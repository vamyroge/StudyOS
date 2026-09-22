import { requireAuth, getProfile } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { Nav } from "./nav";

export async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Nav username={profile.username} role={profile.role} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
