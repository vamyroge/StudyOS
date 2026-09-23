"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export async function updateTopicMastery({
  studentId,
  subjectId,
  topicId,
  isCorrect,
}: {
  studentId: string;
  subjectId: string;
  topicId: string;
  isCorrect: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get or create topic mastery record
  const { data: existing } = await supabase
    .from("topic_mastery")
    .select("*")
    .eq("student_id", studentId)
    .eq("subject_id", subjectId)
    .eq("topic_id", topicId)
    .single();

  if (existing) {
    // Update existing record using exponential moving average
    const alpha = 0.3; // Learning rate
    const newScore = isCorrect ? 1 : 0;
    const updatedMastery = existing.mastery_score * (1 - alpha) + newScore * alpha;
    
    const { error } = await supabase
      .from("topic_mastery")
      .update({
        mastery_score: updatedMastery,
        questions_attempted: existing.questions_attempted + 1,
        questions_correct: existing.questions_correct + (isCorrect ? 1 : 0),
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)
      .eq("topic_id", topicId);

    if (error) {
      return { success: false, error: "Không thể cập nhật mastery" };
    }
  } else {
    // Create new record
    const { error } = await supabase.from("topic_mastery").insert({
      student_id: studentId,
      subject_id: subjectId,
      topic_id: topicId,
      mastery_score: isCorrect ? 1 : 0,
      questions_attempted: 1,
      questions_correct: isCorrect ? 1 : 0,
      last_attempt_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: "Không thể tạo mastery record" };
    }
  }

  return { success: true };
}

export async function getWeakTopics(studentId: string, subjectId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("topic_mastery")
    .select("*, topics(name), subjects(name)")
    .eq("student_id", studentId)
    .lt("mastery_score", 0.6)
    .order("mastery_score", { ascending: true });

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  const { data, error } = await query.limit(10);

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getStrongTopics(studentId: string, subjectId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("topic_mastery")
    .select("*, topics(name), subjects(name)")
    .eq("student_id", studentId)
    .gte("mastery_score", 0.8)
    .order("mastery_score", { ascending: false });

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  const { data, error } = await query.limit(10);

  if (error || !data) {
    return [];
  }

  return data;
}

export async function generateAdaptiveRecommendation(studentId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get weak topics
  const weakTopics = await getWeakTopics(studentId);

  if (weakTopics.length === 0) {
    return {
      action: "Tiếp tục luyện tập",
      reason: "Bạn đang làm tốt! Hãy tiếp tục học các chủ đề mới.",
      confidence: 0.8,
    };
  }

  const weakestTopic = weakTopics[0];
  const topicName = (weakestTopic as any).topics?.name || "chủ đề này";
  const subjectName = (weakestTopic as any).subjects?.name || "môn học";

  // Create recommendation
  const { error } = await supabase.from("learning_recommendations").insert({
    student_id: studentId,
    action: `Ôn tập ${topicName}`,
    reason: `Bạn đang yếu ở phần ${topicName} (${subjectName}) với mức độ thành thạo ${Math.round(weakestTopic.mastery_score * 100)}%. Hãy dành thời gian ôn lại phần này.`,
    confidence: 0.9,
  });

  if (error) {
    console.error("Failed to create recommendation:", error);
  }

  return {
    action: `Ôn tập ${topicName}`,
    reason: `Độ thành thạo hiện tại: ${Math.round(weakestTopic.mastery_score * 100)}%`,
    confidence: 0.9,
  };
}
