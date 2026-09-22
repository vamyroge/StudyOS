"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";

const privacySchema = z.object({
  allowAiProfile: z.boolean(),
  allowAiHistory: z.boolean(),
  allowAiMistakes: z.boolean(),
  allowAiMastery: z.boolean(),
  allowAiStudySessions: z.boolean(),
  allowPersonalization: z.boolean(),
  allowProactiveRecommendations: z.boolean(),
});

export type PrivacyState = { error: string } | { success: true } | null;

export async function savePrivacySettings(_previousState: PrivacyState, formData: FormData): Promise<PrivacyState> {
  const user = await requireAuth();
  const parsed = privacySchema.safeParse({
    allowAiProfile: formData.get("allowAiProfile") === "on",
    allowAiHistory: formData.get("allowAiHistory") === "on",
    allowAiMistakes: formData.get("allowAiMistakes") === "on",
    allowAiMastery: formData.get("allowAiMastery") === "on",
    allowAiStudySessions: formData.get("allowAiStudySessions") === "on",
    allowPersonalization: formData.get("allowPersonalization") === "on",
    allowProactiveRecommendations: formData.get("allowProactiveRecommendations") === "on",
  });
  if (!parsed.success) return { error: "Cài đặt quyền riêng tư không hợp lệ." };
  const supabase = await createClient();
  const { data: studentProfile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single();
  if (!studentProfile) return { error: "Vui lòng hoàn thiện hồ sơ học tập trước." };
  const { error } = await supabase.from("privacy_settings").upsert({
    student_id: studentProfile.id,
    allow_ai_profile: parsed.data.allowAiProfile,
    allow_ai_history: parsed.data.allowAiHistory,
    allow_ai_mistakes: parsed.data.allowAiMistakes,
    allow_ai_mastery: parsed.data.allowAiMastery,
    allow_ai_study_sessions: parsed.data.allowAiStudySessions,
    allow_personalization: parsed.data.allowPersonalization,
    allow_proactive_recommendations: parsed.data.allowProactiveRecommendations,
  }, { onConflict: "student_id" });
  if (error) return { error: "Không thể lưu cài đặt quyền riêng tư." };
  revalidatePath("/settings");
  return { success: true };
}
