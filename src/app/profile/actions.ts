"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().trim().max(100).optional(),
  grade: z.coerce.number().int().min(10).max(12).optional(),
  className: z.string().trim().max(50).optional(),
  targetExam: z.string().trim().max(100).optional(),
  learningGoals: z.string().trim().max(1000).optional(),
  subjects: z.union([z.string(), z.array(z.string())]).optional(),
});

export type ProfileState = { error: string } | { success: true } | null;

export async function saveStudentProfile(_previousState: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireAuth();
  const subjectsRaw = formData.getAll("subjects");
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") || undefined,
    grade: formData.get("grade") || undefined,
    className: formData.get("className") || undefined,
    targetExam: formData.get("targetExam") || undefined,
    learningGoals: formData.get("learningGoals") || undefined,
    subjects: subjectsRaw.length > 0 ? subjectsRaw.map(String) : undefined,
  });
  if (!parsed.success) return { error: "Thông tin hồ sơ không hợp lệ." };
  const supabase = await createClient();
  if (parsed.data.displayName) {
    const { error: profileError } = await supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("id", user.id);
    if (profileError) return { error: "Không thể cập nhật hồ sơ." };
  }
  const studentData: Record<string, unknown> = { user_id: user.id };
  if (parsed.data.grade) studentData.grade = parsed.data.grade;
  if (parsed.data.className !== undefined) studentData.class_name = parsed.data.className || null;
  if (parsed.data.targetExam !== undefined) studentData.target_exam = parsed.data.targetExam || null;
  if (parsed.data.learningGoals !== undefined) studentData.learning_goals = parsed.data.learningGoals || null;
  if (parsed.data.subjects) studentData.subjects = parsed.data.subjects;
  const { error } = await supabase.from("student_profiles").upsert(studentData, { onConflict: "user_id" });
  if (error) return { error: "Không thể lưu thông tin học tập." };
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}
