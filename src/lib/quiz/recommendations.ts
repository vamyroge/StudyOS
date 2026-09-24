/**
 * Quiz Recommendation Service
 * PHASE 7: Post-Quiz Recommendations
 */

import { createClient } from "@/lib/supabase/async-client";

export interface QuizRecommendation {
  id: string;
  recommendationType:
    | "review_topic"
    | "retry_quiz"
    | "challenge_advanced"
    | "ask_ai_tutor"
    | "practice_more"
    | "take_break"
    | "focus_weak_topics";
  title: string;
  description: string;
  actionUrl: string | null;
  priority: number;
  topicIds: string[] | null;
  metadata: Record<string, any>;
  createdAt: string;
  viewedAt: string | null;
  actedOnAt: string | null;
  dismissedAt: string | null;
}

/**
 * Get recommendations for a specific quiz assessment
 */
export async function getQuizRecommendations(
  assessmentId: string
): Promise<QuizRecommendation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_recommendations")
    .select("*")
    .eq("assessment_id", assessmentId)
    .is("dismissed_at", null)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    recommendationType: item.recommendation_type,
    title: item.title,
    description: item.description,
    actionUrl: item.action_url,
    priority: item.priority,
    topicIds: item.topic_ids,
    metadata: item.metadata || {},
    createdAt: item.created_at,
    viewedAt: item.viewed_at,
    actedOnAt: item.acted_on_at,
    dismissedAt: item.dismissed_at,
  }));
}

/**
 * Get recent recommendations for student (across all quizzes)
 */
export async function getRecentRecommendations(
  studentId: string,
  limit: number = 5
): Promise<QuizRecommendation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_recommendations")
    .select("*")
    .eq("student_id", studentId)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    recommendationType: item.recommendation_type,
    title: item.title,
    description: item.description,
    actionUrl: item.action_url,
    priority: item.priority,
    topicIds: item.topic_ids,
    metadata: item.metadata || {},
    createdAt: item.created_at,
    viewedAt: item.viewed_at,
    actedOnAt: item.acted_on_at,
    dismissedAt: item.dismissed_at,
  }));
}

/**
 * Mark recommendation as viewed
 */
export async function markRecommendationViewed(
  recommendationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("quiz_recommendations")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", recommendationId)
    .is("viewed_at", null);
}

/**
 * Mark recommendation as acted on
 */
export async function markRecommendationActedOn(
  recommendationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("quiz_recommendations")
    .update({ acted_on_at: new Date().toISOString() })
    .eq("id", recommendationId)
    .is("acted_on_at", null);
}

/**
 * Dismiss recommendation
 */
export async function dismissRecommendation(
  recommendationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("quiz_recommendations")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", recommendationId);
}

/**
 * Get recommendation icon and color
 */
export function getRecommendationStyle(type: string): {
  icon: string;
  color: string;
  bgColor: string;
} {
  switch (type) {
    case "review_topic":
      return {
        icon: "📚",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950",
      };
    case "retry_quiz":
      return {
        icon: "🔄",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950",
      };
    case "challenge_advanced":
      return {
        icon: "🎯",
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950",
      };
    case "ask_ai_tutor":
      return {
        icon: "🤖",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950",
      };
    case "practice_more":
      return {
        icon: "💪",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
      };
    case "take_break":
      return {
        icon: "☕",
        color: "text-gray-600",
        bgColor: "bg-gray-50 dark:bg-gray-950",
      };
    case "focus_weak_topics":
      return {
        icon: "🎓",
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950",
      };
    default:
      return {
        icon: "💡",
        color: "text-gray-600",
        bgColor: "bg-gray-50 dark:bg-gray-950",
      };
  }
}
