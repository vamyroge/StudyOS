"use server";

import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginResult = { error: string } | { success: true };

export async function login(formData: FormData): Promise<LoginResult> {
  const supabase = await createClient();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Thông tin đăng nhập không hợp lệ." };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  return { success: true };
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

export type RegisterResult = { error: string } | { success: true; needsEmailConfirmation: boolean };

export async function register(formData: FormData): Promise<RegisterResult> {
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=/verify-email`,
    },
  });
  if (error) return { error: error.message };
  return { success: true, needsEmailConfirmation: !data.session };
}

export type ResendEmailResult = { error: string } | { success: true };

export async function resendVerificationEmail(email?: string): Promise<ResendEmailResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user session, try to use provided email (from signup flow)
  const targetEmail = email || user?.email;
  
  if (!targetEmail) {
    return { error: "Không tìm thấy email. Vui lòng đăng ký lại." };
  }

  if (user?.email_confirmed_at) {
    return { error: "Email đã được xác minh." };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: targetEmail,
    options: {
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=/verify-email`,
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
