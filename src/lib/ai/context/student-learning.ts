/**
 * Student Learning Context Builder
 * Aggregates learning data for AI Study Coach
 * Server action: exports async functions
 */

import { createClient } from "@/lib/supabase/server";

export interface StudentLearningContext {
  profile: {
    grade?: number;
    subjects?: string[];
    goals?: string;
    targetExam?: string;
  } | null;

  quizSummary: {
    totalQuizzes: number;
    totalQuestions: number;
    averageScore: number;
    overallAccuracy: number;
  };

  recentQuizzes: Array<{
    quizId: string;
    subject: string;
    score: number;
    accuracy: number;
    correctCount: number;
    totalQuestions: number;
    completedAt: string;
  }>;

  weakTopics: Array<{
    subject: string;
    topic: string;
    accuracy: number;
    attempts: number;
    masteryScore: number;
  }>;

  strongTopics: Array<{
    subject: string;
    topic: string;
    accuracy: number;
    masteryScore: number;
  }>;

  recentMistakes: Array<{
    subject: string;
    topic?: string;
    question: string;
    selectedAnswer?: string;
    correctAnswer?: string;
    explanation?: string;
    attemptedAt: string;
  }>;

  conversationSummary: {
    recentTopics: string[];
    totalMessages: number;
  } | null;
}

/**
 * Build comprehensive learning context for authenticated user
 * Server action
 */
export async function buildStudentLearningContext(
  userId: string,
  options: {
    includeProfile?: boolean;
    includeQuizHistory?: boolean;
    includeTopics?: boolean;
    includeMistakes?: boolean;
    includeConversation?: boolean;
    quizLimit?: number;
    mistakeLimit?: number;
  } = {}
): Promise<StudentLearningContext> {
  const {
    includeProfile = true,
    includeQuizHistory = true,
    includeTopics = true,
    includeMistakes = true,
    includeConversation = false,
    quizLimit = 10,
    mistakeLimit = 5,
  } = options;

  const supabase = await createClient();

  const [
    profileData,
    quizSummaryData,
    recentQuizzesData,
    weakTopicsData,
    strongTopicsData,
    recentMistakesData,
    conversationData,
  ] = await Promise.all([
    includeProfile
      ? supabase
          .from("student_profiles")
          .select("grade, subjects, learning_goals, target_exam")
          .eq("user_id", userId)
          .single()
      : Promise.resolve({ data: null }),

    includeQuizHistory
      ? supabase
          .from("quiz_assessments")
          .select("score, accuracy, correct_answers, total_questions")
          .eq("student_id", userId)
          .not("completed_at", "is", null)
      : Promise.resolve({ data: [] }),

    includeQuizHistory
      ? supabase
          .from("quiz_assessments")
          .select(`
            id,
            score,
            accuracy,
            correct_answers,
            total_questions,
            completed_at,
            subjects(name)
          `)
          .eq("student_id", userId)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(quizLimit)
      : Promise.resolve({ data: [] }),

    includeTopics
      ? supabase
          .from("topic_mastery")
          .select(`
            mastery_score,
            questions_attempted,
            questions_correct,
            topics(name),
            subjects(name)
          `)
          .eq("student_id", userId)
          .lt("mastery_score", 0.6)
          .order("mastery_score", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] }),

    includeTopics
      ? supabase
          .from("topic_mastery")
          .select(`
            mastery_score,
            questions_correct,
            questions_attempted,
            topics(name),
            subjects(name)
          `)
          .eq("student_id", userId)
          .gte("mastery_score", 0.8)
          .order("mastery_score", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    includeMistakes
      ? supabase
          .from("quiz_answers")
          .select(`
            is_correct,
            created_at,
            selected_answer_index,
            quiz_questions(
              question_text,
              options,
              correct_answer_index,
              explanation,
              topic
            ),
            quiz_assessments!inner(
              student_id,
              subjects(name)
            )
          `)
          .eq("quiz_assessments.student_id", userId)
          .eq("is_correct", false)
          .order("created_at", { ascending: false })
          .limit(mistakeLimit)
      : Promise.resolve({ data: [] }),

    includeConversation
      ? supabase
          .from("conversations")
          .select("id")
          .eq("student_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const quizzes = quizSummaryData.data || [];
  const quizSummary = {
    totalQuizzes: quizzes.length,
    totalQuestions: quizzes.reduce((sum, q) => sum + (q.total_questions || 0), 0),
    averageScore: quizzes.length > 0 
      ? quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizzes.length 
      : 0,
    overallAccuracy: quizzes.length > 0
      ? quizzes.reduce((sum, q) => sum + (q.accuracy || 0), 0) / quizzes.length
      : 0,
  };

  const recentQuizzes = (recentQuizzesData.data || []).map((q: any) => ({
    quizId: q.id,
    subject: q.subjects?.name || "Unknown",
    score: Math.round(q.score || 0),
    accuracy: Math.round(q.accuracy || 0),
    correctCount: q.correct_answers || 0,
    totalQuestions: q.total_questions || 0,
    completedAt: q.completed_at,
  }));

  const weakTopics = (weakTopicsData.data || []).map((t: any) => ({
    subject: t.subjects?.name || "Unknown",
    topic: t.topics?.name || "Unknown",
    accuracy: t.questions_attempted > 0 
      ? Math.round((t.questions_correct / t.questions_attempted) * 100) 
      : 0,
    attempts: t.questions_attempted || 0,
    masteryScore: Math.round((t.mastery_score || 0) * 100),
  }));

  const strongTopics = (strongTopicsData.data || []).map((t: any) => ({
    subject: t.subjects?.name || "Unknown",
    topic: t.topics?.name || "Unknown",
    accuracy: t.questions_attempted > 0
      ? Math.round((t.questions_correct / t.questions_attempted) * 100)
      : 100,
    masteryScore: Math.round((t.mastery_score || 0) * 100),
  }));

  const recentMistakes = (recentMistakesData.data || []).map((m: any) => {
    const question = m.quiz_questions;
    const subject = m.quiz_assessments?.subjects?.name || "Unknown";
    
    return {
      subject,
      topic: question?.topic,
      question: question?.question_text || "N/A",
      selectedAnswer: question?.options?.[m.selected_answer_index],
      correctAnswer: question?.options?.[question?.correct_answer_index],
      explanation: question?.explanation,
      attemptedAt: m.created_at,
    };
  });

  const conversationSummary = conversationData.data
    ? {
        recentTopics: [],
        totalMessages: 0,
      }
    : null;

  return {
    profile: profileData.data
      ? {
          grade: profileData.data.grade,
          subjects: profileData.data.subjects,
          goals: profileData.data.learning_goals,
          targetExam: profileData.data.target_exam,
        }
      : null,
    quizSummary,
    recentQuizzes,
    weakTopics,
    strongTopics,
    recentMistakes,
    conversationSummary,
  };
}

/**
 * Format context for AI prompt
 */
export function formatContextForAI(context: StudentLearningContext): string {
  const sections: string[] = [];

  if (context.profile) {
    sections.push(`<student_profile>
Lớp: ${context.profile.grade || "N/A"}
Môn học quan tâm: ${context.profile.subjects?.join(", ") || "N/A"}
Mục tiêu: ${context.profile.goals || "N/A"}
Kỳ thi mục tiêu: ${context.profile.targetExam || "N/A"}
</student_profile>`);
  }

  if (context.quizSummary.totalQuizzes > 0) {
    sections.push(`<quiz_performance>
Tổng số quiz đã làm: ${context.quizSummary.totalQuizzes}
Tổng số câu hỏi: ${context.quizSummary.totalQuestions}
Điểm trung bình: ${Math.round(context.quizSummary.averageScore)}%
Độ chính xác tổng thể: ${Math.round(context.quizSummary.overallAccuracy)}%
</quiz_performance>`);
  }

  if (context.recentQuizzes.length > 0) {
    const quizList = context.recentQuizzes
      .map(
        (q) =>
          `- ${q.subject}: ${q.correctCount}/${q.totalQuestions} (${q.accuracy}%) - ${new Date(q.completedAt).toLocaleDateString("vi-VN")}`
      )
      .join("\n");
    sections.push(`<recent_quizzes>
${quizList}
</recent_quizzes>`);
  }

  if (context.weakTopics.length > 0) {
    const weakList = context.weakTopics
      .map((t) => `- ${t.subject} — ${t.topic}: ${t.accuracy}% (${t.attempts} lần thử, mastery: ${t.masteryScore}%)`)
      .join("\n");
    sections.push(`<weak_topics>
${weakList}
</weak_topics>`);
  }

  if (context.strongTopics.length > 0) {
    const strongList = context.strongTopics
      .map((t) => `- ${t.subject} — ${t.topic}: ${t.accuracy}% (mastery: ${t.masteryScore}%)`)
      .join("\n");
    sections.push(`<strong_topics>
${strongList}
</strong_topics>`);
  }

  if (context.recentMistakes.length > 0) {
    const mistakeList = context.recentMistakes
      .map((m, i) => {
        const parts = [
          `${i + 1}. ${m.subject}${m.topic ? ` — ${m.topic}` : ""}`,
          `   Câu hỏi: ${m.question.substring(0, 100)}${m.question.length > 100 ? "..." : ""}`,
        ];
        if (m.selectedAnswer && m.correctAnswer) {
          parts.push(`   Chọn: ${m.selectedAnswer}`);
          parts.push(`   Đúng: ${m.correctAnswer}`);
        }
        return parts.join("\n");
      })
      .join("\n\n");
    sections.push(`<recent_mistakes>
${mistakeList}
</recent_mistakes>`);
  }

  return sections.join("\n\n");
}
