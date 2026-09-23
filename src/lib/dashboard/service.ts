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
  quizzesTaken: number;
  averageQuizScore: number;
  conversationsCount: number;
  studyStreak: number;
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  const supabase = await createClient();
  
  // Get attempts
  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, question_id, is_correct, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get quiz stats
  const { data: quizzes } = await supabase
    .from("quiz_assessments")
    .select("score, completed_at")
    .eq("student_id", studentId)
    .not("completed_at", "is", null);

  // Get conversations count
  const { count: conversationsCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", studentId);

  // Calculate study streak (days with activity)
  const { data: recentActivity } = await supabase
    .from("attempts")
    .select("created_at")
    .eq("student_id", studentId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false });

  let studyStreak = 0;
  if (recentActivity && recentActivity.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDate = today;
    
    const activityDates = new Set(
      recentActivity.map(a => new Date(a.created_at).toDateString())
    );

    while (activityDates.has(currentDate.toDateString())) {
      studyStreak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  const total = attempts?.length || 0;
  const correct = attempts?.filter((a) => a.is_correct).length || 0;
  const quizzesTaken = quizzes?.length || 0;
  const avgQuizScore = quizzesTaken > 0
    ? Math.round(quizzes!.reduce((sum, q) => sum + q.score, 0) / quizzesTaken)
    : 0;

  return {
    totalAttempts: total,
    correctAttempts: correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    recentAttempts: attempts?.slice(0, 10) || [],
    quizzesTaken,
    averageQuizScore: avgQuizScore,
    conversationsCount: conversationsCount || 0,
    studyStreak,
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