import { createClient } from "@/lib/supabase/server";
import { calculatePercentage } from "@/lib/utils";

export interface StudentStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number | null;
  recentAttempts: Array<{
    id: string;
    question_id: string;
    is_correct: boolean;
    created_at: string;
  }>;
  quizzesTaken: number;
  averageQuizScore: number | null;
  conversationsCount: number;
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  const supabase = await createClient();

  const { count: totalCount } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);

  const { count: correctCount } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("is_correct", true);

  const { data: recentAttempts } = await supabase
    .from("attempts")
    .select("id, question_id, is_correct, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: quizzes } = await supabase
    .from("quiz_assessments")
    .select("score, completed_at")
    .eq("student_id", studentId)
    .not("completed_at", "is", null);

  const { count: conversationsCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", studentId);

  const total = totalCount ?? 0;
  const correct = correctCount ?? 0;
  const quizzesTaken = quizzes?.length ?? 0;
  const avgQuizScore = quizzesTaken > 0
    ? Math.round(quizzes!.reduce((sum, q) => sum + q.score, 0) / quizzesTaken)
    : null;

  return {
    totalAttempts: total,
    correctAttempts: correct,
    accuracy: calculatePercentage(correct, total),
    recentAttempts: recentAttempts ?? [],
    quizzesTaken,
    averageQuizScore: avgQuizScore,
    conversationsCount: conversationsCount ?? 0,
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

export async function getTopicMastery(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topic_mastery")
    .select(`
      *,
      topics(name, subject_id),
      subjects(name)
    `)
    .eq("student_id", studentId)
    .order("mastery_score", { ascending: true });

  if (error || !data) return [];
  
  return data.map((item: any) => ({
    id: item.id,
    topicName: item.topics?.name || "Unknown",
    subjectName: item.subjects?.name || "Unknown",
    masteryScore: item.mastery_score,
    confidence: item.confidence,
    questionsAttempted: item.questions_attempted,
    questionsCorrect: item.questions_correct,
    lastAttempt: item.last_attempt_at,
  }));
}

export interface TopicMasteryData {
  id: string;
  topicName: string;
  subjectName: string;
  masteryScore: number;
  confidence: number;
  questionsAttempted: number;
  questionsCorrect: number;
  lastAttempt: string;
}