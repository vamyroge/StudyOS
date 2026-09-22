import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Role } from "@/types";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return { user, profile };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}