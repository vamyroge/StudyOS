/**
 * Learning Streak Service
 * PHASE 1: Learning Streak System
 */

import { createClient } from "@/lib/supabase/async-client";

export interface LearningStreak {
  currentStreak: number;
  bestStreak: number;
  totalDaysStudied: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
}

export interface DailyActivity {
  date: string;
  activityLevel: "none" | "low" | "medium" | "high";
  totalActivities: number;
  quizCount: number;
  questionCount: number;
  studyMinutes: number;
}

export interface StreakMilestone {
  milestoneDays: number;
  achievedAt: string;
  streakCount: number;
}

/**
 * Get student's current learning streak
 */
export async function getStudentStreak(studentId: string): Promise<LearningStreak> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("learning_streaks")
    .select("*")
    .eq("student_id", studentId)
    .single();
    
  if (error || !data) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalDaysStudied: 0,
      lastActivityDate: null,
      streakStartDate: null,
    };
  }
  
  return {
    currentStreak: data.current_streak,
    bestStreak: data.best_streak,
    totalDaysStudied: data.total_days_studied,
    lastActivityDate: data.last_activity_date,
    streakStartDate: data.streak_start_date,
  };
}

/**
 * Get daily activity summary for heatmap (last N days)
 */
export async function getDailyActivities(
  studentId: string, 
  days: number = 365
): Promise<DailyActivity[]> {
  const supabase = await createClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("daily_activity_summary")
    .select("*")
    .eq("student_id", studentId)
    .gte("activity_date", startStr)
    .order("activity_date", { ascending: false });

  if (!error && data && data.length > 0) {
    return data.map((d) => ({
      date: d.activity_date,
      activityLevel: d.activity_level,
      totalActivities: d.total_activities,
      quizCount: d.quiz_count,
      questionCount: d.question_count,
      studyMinutes: d.study_minutes,
    }));
  }

  const activityMap = new Map<string, { quizCount: number; questionCount: number }>();

  const { data: quizzes } = await supabase
    .from("quiz_assessments")
    .select("completed_at")
    .eq("student_id", studentId)
    .not("completed_at", "is", null)
    .gte("completed_at", startStr);

  if (quizzes) {
    for (const q of quizzes) {
      const date = q.completed_at.split("T")[0];
      const entry = activityMap.get(date) || { quizCount: 0, questionCount: 0 };
      entry.quizCount += 1;
      activityMap.set(date, entry);
    }
  }

  const { data: attempts } = await supabase
    .from("attempts")
    .select("created_at")
    .eq("student_id", studentId)
    .gte("created_at", startStr);

  if (attempts) {
    for (const a of attempts) {
      const date = a.created_at.split("T")[0];
      const entry = activityMap.get(date) || { quizCount: 0, questionCount: 0 };
      entry.questionCount += 1;
      activityMap.set(date, entry);
    }
  }

  const result: DailyActivity[] = [];
  for (const [date, counts] of activityMap.entries()) {
    const total = counts.quizCount + counts.questionCount;
    let activityLevel: "none" | "low" | "medium" | "high" = "none";
    if (total >= 10) activityLevel = "high";
    else if (total >= 5) activityLevel = "medium";
    else if (total >= 1) activityLevel = "low";

    result.push({
      date,
      activityLevel,
      totalActivities: total,
      quizCount: counts.quizCount,
      questionCount: counts.questionCount,
      studyMinutes: 0,
    });
  }

  return result;
}

/**
 * Get achieved streak milestones
 */
export async function getStreakMilestones(studentId: string): Promise<StreakMilestone[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("streak_milestones")
    .select("*")
    .eq("student_id", studentId)
    .order("milestone_days", { ascending: true });
    
  if (error || !data) {
    return [];
  }
  
  return data.map((m) => ({
    milestoneDays: m.milestone_days,
    achievedAt: m.achieved_at,
    streakCount: m.streak_count,
  }));
}

/**
 * Get activity breakdown for a specific date (for tooltip)
 */
export async function getActivityBreakdown(
  studentId: string,
  date: string
): Promise<{
  date: string;
  activities: Array<{ type: string; count: number }>;
  totalActivities: number;
}> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("learning_activities")
    .select("activity_type, activity_count")
    .eq("student_id", studentId)
    .eq("activity_date", date);
    
  if (error || !data) {
    return {
      date,
      activities: [],
      totalActivities: 0,
    };
  }
  
  const activities = data.map((a) => ({
    type: a.activity_type,
    count: a.activity_count,
  }));
  
  const totalActivities = activities.reduce((sum, a) => sum + a.count, 0);
  
  return {
    date,
    activities,
    totalActivities,
  };
}

/**
 * Check if today has activity (to show "studied today" badge)
 */
export async function hasActivityToday(studentId: string): Promise<boolean> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("daily_activity_summary")
    .select("total_activities")
    .eq("student_id", studentId)
    .eq("activity_date", today)
    .single();
    
  return !error && data && data.total_activities > 0;
}

/**
 * Get next milestone for motivation
 */
export function getNextMilestone(currentStreak: number): number | null {
  const milestones = [3, 7, 14, 30, 60, 100];
  return milestones.find((m) => m > currentStreak) || null;
}

/**
 * Format activity type for display
 */
export function formatActivityType(type: string): string {
  const labels: Record<string, string> = {
    quiz_completed: "Quiz",
    lesson_completed: "Bài học",
    question_submitted: "Câu hỏi",
    study_task_completed: "Task học tập",
    review_session_completed: "Ôn tập",
    conversation_created: "Hội thoại AI",
  };
  
  return labels[type] || type;
}
