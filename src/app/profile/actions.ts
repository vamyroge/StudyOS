"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  grade: z.coerce.number().int().min(10).max(12),
  className: z.string().trim().max(50).optional(),
  targetExam: z.string().trim().max(100).optional(),
  targetScore: z.string().trim().max(100).optional(),
  learningGoals: z.string().trim().max(1000).optional(),
  subjects: z.union([z.string(), z.array(z.string())]).optional(),
  strongTopics: z.string().trim().max(500).optional(),
  weakTopics: z.string().trim().max(500).optional(),
  studyTimePerDay: z.string().trim().max(50).optional(),
  preferredLearningStyle: z.string().trim().max(200).optional(),
});

export type ProfileState = { error: string } | { success: true } | null;

export async function saveStudentProfile(_previousState: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireAuth();
  const subjectsRaw = formData.getAll("subjects");
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") || undefined,
    grade: formData.get("grade"),
    className: formData.get("className") || undefined,
    targetExam: formData.get("targetExam") || undefined,
    targetScore: formData.get("targetScore") || undefined,
    learningGoals: formData.get("learningGoals") || undefined,
    subjects: subjectsRaw.length > 0 ? subjectsRaw.map(String) : undefined,
    strongTopics: formData.get("strongTopics") || undefined,
    weakTopics: formData.get("weakTopics") || undefined,
    studyTimePerDay: formData.get("studyTimePerDay") || undefined,
    preferredLearningStyle: formData.get("preferredLearningStyle") || undefined,
  });
  
  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
    return { error: "Vui lòng điền đầy đủ thông tin bắt buộc (Tên hiển thị, Khối lớp)." };
  }
  
  const supabase = await createClient();
  
  // Update display name in profiles table
  if (parsed.data.displayName) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: parsed.data.displayName })
      .eq("id", user.id);
    if (profileError) {
      console.error("Profile update error:", profileError);
      return { error: "Không thể cập nhật tên hiển thị." };
    }
  }
  
  // Prepare student profile data with study preferences
  const studyPreferences: Record<string, unknown> = {};
  if (parsed.data.strongTopics) studyPreferences.strong_topics = parsed.data.strongTopics;
  if (parsed.data.weakTopics) studyPreferences.weak_topics = parsed.data.weakTopics;
  if (parsed.data.studyTimePerDay) studyPreferences.study_time_per_day = parsed.data.studyTimePerDay;
  if (parsed.data.preferredLearningStyle) studyPreferences.preferred_learning_style = parsed.data.preferredLearningStyle;
  if (parsed.data.targetScore) studyPreferences.target_score = parsed.data.targetScore;
  
  const studentData: Record<string, unknown> = {
    user_id: user.id,
    grade: parsed.data.grade,
  };
  
  if (parsed.data.className !== undefined) studentData.class_name = parsed.data.className || null;
  if (parsed.data.targetExam !== undefined) studentData.target_exam = parsed.data.targetExam || null;
  if (parsed.data.learningGoals !== undefined) studentData.learning_goals = parsed.data.learningGoals || null;
  if (parsed.data.subjects) studentData.subjects = parsed.data.subjects;
  if (Object.keys(studyPreferences).length > 0) studentData.study_preferences = studyPreferences;
  
  const { error } = await supabase
    .from("student_profiles")
    .upsert(studentData, { onConflict: "user_id" });
    
  if (error) {
    console.error("Student profile upsert error:", error);
    return { error: "Không thể lưu thông tin học tập." };
  }
  
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}
