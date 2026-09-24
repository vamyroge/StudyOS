/**
 * Daily Study Recommendation Service
 * PHASE 12: Smart daily focus suggestions
 */

import { createClient } from "@/lib/supabase/async-client";
import { getStudentWeaknesses } from "./strength-weakness";

export interface DailyRecommendation {
  title: string;
  description: string;
  reason: string;
  actionUrl: string;
  priority: number;
  estimatedMinutes: number;
  topicIds: string[];
}

/**
 * Generate personalized daily study recommendations
 */
export async function getDailyRecommendations(
  studentId: string
): Promise<DailyRecommendation[]> {
  const recommendations: DailyRecommendation[] = [];
  const supabase = await createClient();

  // Get weaknesses
  const weaknesses = await getStudentWeaknesses(studentId, 3);

  // Get quiz activity today
  const today = new Date().toISOString().split("T")[0];
  const { data: todayQuizzes } = await supabase
    .from("quiz_assessments")
    .select("id")
    .eq("student_id", studentId)
    .gte("completed_at", today);

  const hasQuizToday = todayQuizzes && todayQuizzes.length > 0;

  // Recommendation 1: Focus on weakest topic
  if (weaknesses.length > 0) {
    const weakest = weaknesses[0];
    recommendations.push({
      title: `Ôn tập: ${weakest.topicName}`,
      description: `Dành 15-20 phút ôn lại chủ đề này`,
      reason: `Đây là topic yếu nhất với độ chính xác ${Math.round(weakest.recentAccuracy * 100)}%`,
      actionUrl: `/tutor?topic=${weakest.topicId}`,
      priority: 5,
      estimatedMinutes: 15,
      topicIds: [weakest.topicId],
    });
  }

  // Recommendation 2: Daily quiz if not done today
  if (!hasQuizToday) {
    recommendations.push({
      title: "Làm quiz hôm nay",
      description: "Duy trì chuỗi học tập với 1 quiz nhanh",
      reason: "Bạn chưa làm quiz nào hôm nay",
      actionUrl: "/quiz",
      priority: 4,
      estimatedMinutes: 10,
      topicIds: [],
    });
  }

  // Recommendation 3: Practice multiple weak topics
  if (weaknesses.length >= 2) {
    recommendations.push({
      title: "Luyện tập các chủ đề yếu",
      description: `Làm 10 câu về ${weaknesses.slice(0, 2).map(w => w.topicName).join(", ")}`,
      reason: "Các chủ đề này đang cần được củng cố",
      actionUrl: "/questions",
      priority: 3,
      estimatedMinutes: 15,
      topicIds: weaknesses.slice(0, 2).map(w => w.topicId),
    });
  }

  // Recommendation 4: Review mistakes
  const { data: recentMistakes } = await supabase
    .from("quiz_answers")
    .select("id")
    .eq("is_correct", false)
    .in("assessment_id", 
      (await supabase
        .from("quiz_assessments")
        .select("id")
        .eq("student_id", studentId)
      ).data?.map(a => a.id) || []
    )
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (recentMistakes && recentMistakes.length > 0) {
    recommendations.push({
      title: "Ôn lại câu sai tuần này",
      description: "Xem lại và hiểu rõ các lỗi đã mắc phải",
      reason: "Bạn có một số câu sai trong tuần qua",
      actionUrl: "/settings",
      priority: 2,
      estimatedMinutes: 10,
      topicIds: [],
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * Get focus message for today
 */
export async function getTodayFocusMessage(studentId: string): Promise<string> {
  const weaknesses = await getStudentWeaknesses(studentId, 1);
  
  if (weaknesses.length > 0) {
    const weakest = weaknesses[0];
    return `Hôm nay tập trung vào: ${weakest.topicName} (${weakest.subjectName})`;
  }

  return "Hôm nay tiếp tục duy trì chuỗi học tập!";
}
