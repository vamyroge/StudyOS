/**
 * Quiz Result Analysis Service
 * PHASE 2-3: Enhanced Quiz Result Experience
 */

import { createClient } from "@/lib/supabase/server";

export interface QuizResultAnalysis {
  performance: "strong" | "average" | "weak";
  performanceMessage: string;
  performanceColor: string;
  topicBreakdown: Array<{
    topicId: string;
    topicName: string;
    questionsAttempted: number;
    questionsCorrect: number;
    accuracy: number;
    performance: "strong" | "developing" | "needs_review";
  }>;
  skillTags: Array<{
    skill: string;
    performance: "strong" | "developing" | "needs_review";
  }>;
  comparisonToAverage: {
    yourScore: number;
    classAverage: number;
    percentile: number;
  } | null;
}

/**
 * Analyze quiz performance and generate insights
 */
export async function analyzeQuizResult(
  assessmentId: string,
  studentId: string
): Promise<QuizResultAnalysis> {
  const supabase = await createClient();

  // Get assessment details
  const { data: assessment } = await supabase
    .from("quiz_assessments")
    .select("*, subjects(name)")
    .eq("id", assessmentId)
    .single();

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  // Get quiz answers with question details (support both old and new schema)
  const { data: answers } = await supabase
    .from("quiz_answers")
    .select(`
      *,
      quiz_questions(
        id,
        topic,
        difficulty
      ),
      questions(
        id,
        topic_id,
        difficulty,
        topics(id, name, subject_id)
      )
    `)
    .eq("assessment_id", assessmentId);

  // Determine overall performance
  const accuracy = assessment.accuracy;
  let performance: "strong" | "average" | "weak";
  let performanceMessage: string;
  let performanceColor: string;

  if (accuracy >= 80) {
    performance = "strong";
    performanceMessage = "Bạn đang làm tốt ở chủ đề này. Hãy tiếp tục duy trì!";
    performanceColor = "text-green-600";
  } else if (accuracy >= 60) {
    performance = "average";
    performanceMessage = "Kiến thức đã khá ổn nhưng vẫn còn một số điểm cần củng cố.";
    performanceColor = "text-yellow-600";
  } else {
    performance = "weak";
    performanceMessage = "Bạn nên ôn lại chủ đề này trước khi làm quiz tiếp theo.";
    performanceColor = "text-red-600";
  }

  // Topic breakdown analysis
  const topicMap = new Map<
    string,
    {
      topicId: string;
      topicName: string;
      correct: number;
      total: number;
    }
  >();

  answers?.forEach((answer: any) => {
    // Try new schema first (quiz_questions), fallback to old schema (questions)
    const topic = answer.quiz_questions?.topic || answer.questions?.topics?.name;
    const topicId = answer.quiz_questions?.id || answer.questions?.topics?.id || topic;
    const topicName = topic || "Unknown";

    if (topicId) {
      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, {
          topicId,
          topicName,
          correct: 0,
          total: 0,
        });
      }

      const topicData = topicMap.get(topicId)!;
      topicData.total++;
      if (answer.is_correct) {
        topicData.correct++;
      }
    }
  });

  const topicBreakdown = Array.from(topicMap.values()).map((topic) => {
    const accuracy = topic.total > 0 ? (topic.correct / topic.total) * 100 : 0;
    let performance: "strong" | "developing" | "needs_review";

    if (accuracy >= 75) {
      performance = "strong";
    } else if (accuracy >= 50) {
      performance = "developing";
    } else {
      performance = "needs_review";
    }

    return {
      topicId: topic.topicId,
      topicName: topic.topicName,
      questionsAttempted: topic.total,
      questionsCorrect: topic.correct,
      accuracy,
      performance,
    };
  });

  // Skill tags (simplified for now, can be enhanced later)
  const skillTags = topicBreakdown.map((topic) => ({
    skill: topic.topicName,
    performance: topic.performance,
  }));

  // Get class average (if applicable)
  let comparisonToAverage = null;
  if (assessment.subject_id) {
    const { data: classStats } = await supabase
      .from("quiz_assessments")
      .select("score")
      .eq("subject_id", assessment.subject_id)
      .eq("quiz_type", assessment.quiz_type)
      .not("completed_at", "is", null)
      .limit(50);

    if (classStats && classStats.length > 0) {
      const scores = classStats.map((s) => s.score).sort((a, b) => a - b);
      const classAverage =
        scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const percentile =
        (scores.filter((s) => s <= assessment.score).length / scores.length) *
        100;

      comparisonToAverage = {
        yourScore: Math.round(assessment.score),
        classAverage: Math.round(classAverage),
        percentile: Math.round(percentile),
      };
    }
  }

  return {
    performance,
    performanceMessage,
    performanceColor,
    topicBreakdown,
    skillTags,
    comparisonToAverage,
  };
}

/**
 * Get performance badge component props
 */
export function getPerformanceBadge(
  performance: "strong" | "developing" | "needs_review"
): {
  icon: string;
  label: string;
  variant: "success" | "warning" | "destructive";
} {
  switch (performance) {
    case "strong":
      return {
        icon: "🟢",
        label: "Mạnh",
        variant: "success",
      };
    case "developing":
      return {
        icon: "🟡",
        label: "Đang phát triển",
        variant: "warning",
      };
    case "needs_review":
      return {
        icon: "🔴",
        label: "Cần ôn tập",
        variant: "destructive",
      };
  }
}
