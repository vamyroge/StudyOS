"use server";

import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  const supabase = await createClient();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Thông tin đăng nhập không hợp lệ." };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect("/dashboard");
}

const registerSchema = z
  .object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp.",
    path: ["confirmPassword"],
  });

export async function register(formData: FormData) {
  const supabase = await createClient();
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const issues = (parsed.error as unknown as { issues: Array<{ message: string }> }).issues;
    return { error: issues?.[0]?.message || "Thông tin không hợp lệ." };
  }
  const { email, username, password } = parsed.data;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: error.message };
  redirect("/login?registered=true");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
