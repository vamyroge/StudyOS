"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().trim().max(100).optional(),
  grade: z.coerce.number().int().min(10).max(12),
  className: z.string().trim().max(50).optional(),
  targetExam: z.string().trim().max(100).optional(),
  learningGoals: z.string().trim().max(1000).optional(),
});

export type ProfileState = { error: string } | { success: true } | null;

export async function saveStudentProfile(_previousState: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireAuth();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") || undefined,
    grade: formData.get("grade"),
    className: formData.get("className") || undefined,
    targetExam: formData.get("targetExam") || undefined,
    learningGoals: formData.get("learningGoals") || undefined,
  });
  if (!parsed.success) return { error: "Thông tin hồ sơ không hợp lệ." };
  const supabase = await createClient();
  const { error: profileError } = await supabase.from("profiles").update({ display_name: parsed.data.displayName || null }).eq("id", user.id);
  if (profileError) return { error: "Không thể cập nhật hồ sơ." };
  const { error } = await supabase.from("student_profiles").upsert({
    user_id: user.id,
    grade: parsed.data.grade,
    class_name: parsed.data.className || null,
    target_exam: parsed.data.targetExam || null,
    learning_goals: parsed.data.learningGoals || null,
  }, { onConflict: "user_id" });
  if (error) return { error: "Không thể lưu thông tin học tập." };
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
