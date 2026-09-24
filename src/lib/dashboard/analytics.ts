/**
 * Quiz Analytics Service
 * PHASE 5: Dashboard Quiz Analytics & Charts
 */

import { createClient } from "@/lib/supabase/async-client";
import { calculatePercentage } from "@/lib/utils";

export interface QuizPerformanceData {
  quizId: string;
  quizType: string;
  subjectName: string;
  score: number;
  accuracy: number;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalQuizzes: number;
  averageScore: number;
  averageAccuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  trend: "improving" | "stable" | "declining";
  lastQuizDate: string | null;
}

export interface OverallPerformance {
  totalQuizzes: number;
  averageScore: number | null;
  averageAccuracy: number | null;
  totalQuestions: number;
  totalCorrectAnswers: number;
  bestScore: number | null;
  worstScore: number | null;
  improvementRate: number | null;
}

/**
 * Get recent quiz performance (for chart)
 */
export async function getRecentQuizPerformance(
  studentId: string,
  limit: number = 14
): Promise<QuizPerformanceData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_assessments")
    .select(
      `
      id,
      quiz_type,
      score,
      accuracy,
      total_questions,
      correct_answers,
      completed_at,
      subjects(name)
    `
    )
    .eq("student_id", studentId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data
    .map((item: any) => ({
      quizId: item.id,
      quizType: item.quiz_type,
      subjectName: item.subjects?.name || "Unknown",
      score: item.score,
      accuracy: item.accuracy,
      completedAt: item.completed_at,
      totalQuestions: item.total_questions,
      correctAnswers: item.correct_answers,
    }))
    .reverse(); // Oldest to newest for chart
}

/**
 * Get subject performance breakdown
 */
export async function getSubjectPerformance(
  studentId: string
): Promise<SubjectPerformance[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_assessments")
    .select(
      `
      id,
      subject_id,
      score,
      accuracy,
      total_questions,
      correct_answers,
      completed_at,
      subjects(name)
    `
    )
    .eq("student_id", studentId)
    .not("completed_at", "is", null)
    .not("subject_id", "is", null);

  if (error || !data) return [];

  // Group by subject
  const subjectMap = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      quizzes: Array<{
        score: number;
        accuracy: number;
        totalQuestions: number;
        correctAnswers: number;
        completedAt: string;
      }>;
    }
  >();

  data.forEach((item: any) => {
    const subjectId = item.subject_id;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subjectId,
        subjectName: item.subjects?.name || "Unknown",
        quizzes: [],
      });
    }

    subjectMap.get(subjectId)!.quizzes.push({
      score: item.score,
      accuracy: item.accuracy,
      totalQuestions: item.total_questions,
      correctAnswers: item.correct_answers,
      completedAt: item.completed_at,
    });
  });

  // Calculate metrics for each subject
  const subjects: SubjectPerformance[] = [];

  subjectMap.forEach((subject) => {
    const quizzes = subject.quizzes;
    const totalQuizzes = quizzes.length;

    if (totalQuizzes === 0) return;

    const avgScore =
      quizzes.reduce((sum, q) => sum + q.score, 0) / totalQuizzes;
    const avgAccuracy =
      quizzes.reduce((sum, q) => sum + q.accuracy, 0) / totalQuizzes;
    const totalQuestions = quizzes.reduce((sum, q) => sum + q.totalQuestions, 0);
    const correctAnswers = quizzes.reduce((sum, q) => sum + q.correctAnswers, 0);

    // Determine trend
    let trend: "improving" | "stable" | "declining" = "stable";
    if (quizzes.length >= 3) {
      const recent3 = quizzes.slice(-3);
      const older3 = quizzes.slice(-6, -3);

      if (older3.length === 3) {
        const recentAvg =
          recent3.reduce((sum, q) => sum + q.accuracy, 0) / 3;
        const olderAvg =
          older3.reduce((sum, q) => sum + q.accuracy, 0) / 3;

        if (recentAvg > olderAvg + 5) trend = "improving";
        else if (recentAvg < olderAvg - 5) trend = "declining";
      }
    }

    const lastQuiz = quizzes[quizzes.length - 1];

    subjects.push({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      totalQuizzes,
      averageScore: avgScore,
      averageAccuracy: avgAccuracy,
      totalQuestions,
      correctAnswers,
      trend,
      lastQuizDate: lastQuiz.completedAt,
    });
  });

  return subjects.sort((a, b) => b.averageScore - a.averageScore);
}

/**
 * Get overall performance stats
 */
export async function getOverallPerformance(
  studentId: string
): Promise<OverallPerformance> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_assessments")
    .select("score, accuracy, total_questions, correct_answers, completed_at")
    .eq("student_id", studentId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: true });

if (error || !data || data.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: null,
      averageAccuracy: null,
      totalQuestions: 0,
      totalCorrectAnswers: 0,
      bestScore: null,
      worstScore: null,
      improvementRate: null,
    };
  }

  const totalQuizzes = data.length;
  const avgScore = data.reduce((sum, q) => sum + q.score, 0) / totalQuizzes;
  const avgAccuracy =
    data.reduce((sum, q) => sum + q.accuracy, 0) / totalQuizzes;
  const totalQuestions = data.reduce((sum, q) => sum + q.total_questions, 0);
  const totalCorrectAnswers = data.reduce(
    (sum, q) => sum + q.correct_answers,
    0
  );
  const bestScore = Math.max(...data.map((q) => q.score));
  const worstScore = Math.min(...data.map((q) => q.score));

  // Calculate improvement rate (compare first 3 vs last 3 quizzes)
let improvementRate: number | null = null;
  if (totalQuizzes >= 6) {
    const first3 = data.slice(0, 3);
    const last3 = data.slice(-3);

    const first3Avg =
      first3.reduce((sum, q) => sum + q.accuracy, 0) / 3;
    const last3Avg =
      last3.reduce((sum, q) => sum + q.accuracy, 0) / 3;

    improvementRate = last3Avg - first3Avg;
  }

  return {
    totalQuizzes,
    averageScore: avgScore,
    averageAccuracy: avgAccuracy,
    totalQuestions,
    totalCorrectAnswers,
    bestScore,
    worstScore,
    improvementRate,
  };
}

/**
 * Get quiz frequency by day of week
 */
export async function getQuizFrequencyByDay(
  studentId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_assessments")
    .select("completed_at")
    .eq("student_id", studentId)
    .not("completed_at", "is", null);

  if (error || !data) {
    return {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };
  }

  const dayCount: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  data.forEach((item) => {
    const date = new Date(item.completed_at);
    const dayName = dayNames[date.getDay()];
    dayCount[dayName]++;
  });

  return dayCount;
}
