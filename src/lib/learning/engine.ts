import { createAdminClient } from "@/lib/supabase/server";

export async function updateMastery(studentId: string, conceptId: string, isCorrect: boolean) {
  const supabase = await createAdminClient();
  const { data: existing } = await supabase
    .from("student_mastery")
    .select("mastery_level")
    .eq("student_id", studentId)
    .eq("concept_id", conceptId)
    .single();

  const current = existing?.mastery_level ?? 0;
  const delta = isCorrect ? 0.1 : -0.15;
  const newLevel = Math.max(0, Math.min(1, current + delta));

  const { error: masteryError } = await supabase.from("student_mastery").upsert({
    student_id: studentId,
    concept_id: conceptId,
    mastery_level: newLevel,
    algorithm_version: "v1",
    last_assessed_at: new Date().toISOString(),
  }, { onConflict: "student_id,concept_id" });
  if (masteryError) throw new Error("Could not update mastery.");

  if (newLevel < 0.4) {
    const { error } = await supabase.from("student_weaknesses").upsert({
      student_id: studentId,
      concept_id: conceptId,
      severity: 1 - newLevel,
      identified_at: new Date().toISOString(),
    }, { onConflict: "student_id,concept_id" });
    if (error) throw new Error("Could not update weakness.");
  } else {
    const { error } = await supabase.from("student_weaknesses").delete().eq("student_id", studentId).eq("concept_id", conceptId);
    if (error) throw new Error("Could not clear weakness.");
  }

  return newLevel;
}

export async function logMistake(attemptId: string, studentId: string, conceptId: string | null, errorType: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("mistakes").insert({
    attempt_id: attemptId,
    student_id: studentId,
    concept_id: conceptId,
    error_type: errorType,
    confidence: 0.5,
  });
  if (error) throw new Error("Could not log mistake.");
}

export async function generateRecommendations(studentId: string) {
  const supabase = await createAdminClient();
  const { data: weaknesses } = await supabase
    .from("student_weaknesses")
    .select("concept_id, severity")
    .eq("student_id", studentId)
    .order("severity", { ascending: false })
    .limit(3);

  if (!weaknesses || weaknesses.length === 0) return;

  const recs = weaknesses.map((w) => ({
    student_id: studentId,
    action: "Ôn tập concept",
    reason: `Concept ${w.concept_id.slice(0, 8)} có mức độ thành thạo thấp (${Math.round((1 - w.severity) * 100)}%).`,
    evidence: `severity: ${w.severity}`,
    confidence: 0.7,
    dedup_key: `weakness:${w.concept_id}`,
    status: "active",
    generated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("learning_recommendations")
    .upsert(recs, { onConflict: "student_id,dedup_key" });
  if (error) throw new Error("Could not generate recommendations.");
}
