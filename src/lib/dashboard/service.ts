import { createClient } from "@/lib/supabase/server";

export interface StudentStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  recentAttempts: Array<{
    id: string;
    question_id: string;
    is_correct: boolean;
    created_at: string;
  }>;
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  const supabase = await createClient();
  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("id, question_id, is_correct, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !attempts) {
    return { totalAttempts: 0, correctAttempts: 0, accuracy: 0, recentAttempts: [] };
  }

  const total = attempts.length;
  const correct = attempts.filter((a) => a.is_correct).length;

  return {
    totalAttempts: total,
    correctAttempts: correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    recentAttempts: attempts.slice(0, 10),
  };
}

export async function getStudentMastery(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_mastery")
    .select("concept_id, mastery_level, last_assessed_at")
    .eq("student_id", studentId)
    .order("mastery_level", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getStudentWeaknesses(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_weaknesses")
    .select("concept_id, severity, identified_at")
    .eq("student_id", studentId)
    .order("severity", { ascending: false })
    .limit(5);

  if (error || !data) return [];
  return data;
}

export async function getRecommendations(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_recommendations")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data) return [];
  return data;
}