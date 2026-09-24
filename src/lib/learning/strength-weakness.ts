/**
 * Strength/Weakness Engine Service
 * PHASE 4: Advanced performance pattern analysis
 */

import { createClient } from "@/lib/supabase/async-client";

export interface StrengthWeaknessItem {
  id: string;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  classification: "strength" | "weakness" | "neutral";
  confidence: number;
  totalAttempts: number;
  correctAttempts: number;
  recentAccuracy: number;
  historicalAccuracy: number;
  trend: "improving" | "stable" | "declining" | "unknown";
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  daysSinceLastAttempt: number | null;
  lastAttemptAt: string | null;
}

export interface MistakePattern {
  id: string;
  topicId: string;
  topicName: string;
  patternType:
    | "conceptual_mistake"
    | "calculation_mistake"
    | "misread_question"
    | "formula_mistake"
    | "careless_mistake"
    | "unknown";
  occurrenceCount: number;
  severity: number;
  firstOccurredAt: string;
  lastOccurredAt: string;
}

export interface ImprovementRecord {
  topicId: string;
  topicName: string;
  baselineAccuracy: number;
  currentAccuracy: number;
  improvementPercentage: number;
  daysElapsed: number;
  milestone: string | null;
}

/**
 * Get student's strengths
 */
export async function getStudentStrengths(
  studentId: string,
  limit: number = 10
): Promise<StrengthWeaknessItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_strengths_weaknesses")
    .select(
      `
      *,
      topics(name, subject_id),
      subjects(name)
    `
    )
    .eq("student_id", studentId)
    .eq("classification", "strength")
    .order("confidence", { ascending: false })
    .order("recent_accuracy", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.id,
    topicId: item.topic_id,
    topicName: item.topics?.name || "Unknown",
    subjectId: item.subject_id,
    subjectName: item.subjects?.name || "Unknown",
    classification: item.classification,
    confidence: item.confidence,
    totalAttempts: item.total_attempts,
    correctAttempts: item.correct_attempts,
    recentAccuracy: item.recent_accuracy,
    historicalAccuracy: item.historical_accuracy,
    trend: item.trend,
    consecutiveCorrect: item.consecutive_correct,
    consecutiveIncorrect: item.consecutive_incorrect,
    daysSinceLastAttempt: item.days_since_last_attempt,
    lastAttemptAt: item.last_attempt_at,
  }));
}

/**
 * Get student's weaknesses
 */
export async function getStudentWeaknesses(
  studentId: string,
  limit: number = 10
): Promise<StrengthWeaknessItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_strengths_weaknesses")
    .select(
      `
      *,
      topics(name, subject_id),
      subjects(name)
    `
    )
    .eq("student_id", studentId)
    .eq("classification", "weakness")
    .order("confidence", { ascending: false })
    .order("recent_accuracy", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.id,
    topicId: item.topic_id,
    topicName: item.topics?.name || "Unknown",
    subjectId: item.subject_id,
    subjectName: item.subjects?.name || "Unknown",
    classification: item.classification,
    confidence: item.confidence,
    totalAttempts: item.total_attempts,
    correctAttempts: item.correct_attempts,
    recentAccuracy: item.recent_accuracy,
    historicalAccuracy: item.historical_accuracy,
    trend: item.trend,
    consecutiveCorrect: item.consecutive_correct,
    consecutiveIncorrect: item.consecutive_incorrect,
    daysSinceLastAttempt: item.days_since_last_attempt,
    lastAttemptAt: item.last_attempt_at,
  }));
}

/**
 * Get all strengths and weaknesses by subject
 */
export async function getStrengthsWeaknessesBySubject(
  studentId: string
): Promise<
  Record<
    string,
    {
      subjectName: string;
      strengths: StrengthWeaknessItem[];
      weaknesses: StrengthWeaknessItem[];
    }
  >
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_strengths_weaknesses")
    .select(
      `
      *,
      topics(name, subject_id),
      subjects(name)
    `
    )
    .eq("student_id", studentId)
    .in("classification", ["strength", "weakness"]);

  if (error || !data) return {};

  const grouped: Record<
    string,
    {
      subjectName: string;
      strengths: StrengthWeaknessItem[];
      weaknesses: StrengthWeaknessItem[];
    }
  > = {};

  data.forEach((item: any) => {
    const subjectId = item.subject_id;
    const subjectName = item.subjects?.name || "Unknown";

    if (!grouped[subjectId]) {
      grouped[subjectId] = {
        subjectName,
        strengths: [],
        weaknesses: [],
      };
    }

    const mappedItem: StrengthWeaknessItem = {
      id: item.id,
      topicId: item.topic_id,
      topicName: item.topics?.name || "Unknown",
      subjectId: item.subject_id,
      subjectName,
      classification: item.classification,
      confidence: item.confidence,
      totalAttempts: item.total_attempts,
      correctAttempts: item.correct_attempts,
      recentAccuracy: item.recent_accuracy,
      historicalAccuracy: item.historical_accuracy,
      trend: item.trend,
      consecutiveCorrect: item.consecutive_correct,
      consecutiveIncorrect: item.consecutive_incorrect,
      daysSinceLastAttempt: item.days_since_last_attempt,
      lastAttemptAt: item.last_attempt_at,
    };

    if (item.classification === "strength") {
      grouped[subjectId].strengths.push(mappedItem);
    } else {
      grouped[subjectId].weaknesses.push(mappedItem);
    }
  });

  return grouped;
}

/**
 * Get mistake patterns for student
 */
export async function getMistakePatterns(
  studentId: string
): Promise<MistakePattern[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mistake_patterns")
    .select(
      `
      *,
      topics(name)
    `
    )
    .eq("student_id", studentId)
    .order("severity", { ascending: false })
    .order("occurrence_count", { ascending: false });

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.id,
    topicId: item.topic_id,
    topicName: item.topics?.name || "Unknown",
    patternType: item.pattern_type,
    occurrenceCount: item.occurrence_count,
    severity: item.severity,
    firstOccurredAt: item.first_occurred_at,
    lastOccurredAt: item.last_occurred_at,
  }));
}

/**
 * Get improvement records
 */
export async function getImprovementRecords(
  studentId: string,
  limit: number = 10
): Promise<ImprovementRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("improvement_tracking")
    .select(
      `
      *,
      topics(name)
    `
    )
    .eq("student_id", studentId)
    .order("improvement_percentage", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((item: any) => ({
    topicId: item.topic_id,
    topicName: item.topics?.name || "Unknown",
    baselineAccuracy: item.baseline_accuracy,
    currentAccuracy: item.current_accuracy,
    improvementPercentage: item.improvement_percentage,
    daysElapsed: item.days_elapsed,
    milestone: item.milestone,
  }));
}

/**
 * Get trend badge info
 */
export function getTrendBadge(trend: string): {
  icon: string;
  label: string;
  color: string;
} {
  switch (trend) {
    case "improving":
      return { icon: "📈", label: "Đang tiến bộ", color: "text-green-600" };
    case "declining":
      return { icon: "📉", label: "Đang giảm", color: "text-red-600" };
    case "stable":
      return { icon: "➡️", label: "Ổn định", color: "text-blue-600" };
    default:
      return { icon: "❓", label: "Chưa đủ dữ liệu", color: "text-gray-600" };
  }
}

/**
 * Format mistake pattern type
 */
export function formatMistakeType(type: string): string {
  const labels: Record<string, string> = {
    conceptual_mistake: "Sai khái niệm",
    calculation_mistake: "Sai tính toán",
    misread_question: "Đọc nhầm đề",
    formula_mistake: "Sai công thức",
    careless_mistake: "Sơ ý",
    unknown: "Chưa xác định",
  };

  return labels[type] || type;
}
