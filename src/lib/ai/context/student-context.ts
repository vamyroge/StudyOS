/**
 * Comprehensive Student Context Builder
 * Aggregates ALL learning data for AI personalization
 * 
 * SECURITY: All queries filtered by authenticated userId
 * DATA ACCURACY: Only real database data, no fabrication
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface StudentContext {
  profile: {
    displayName?: string;
    username?: string;
    grade?: number;
    className?: string;
    subjects?: string[];
    goals?: string;
    targetExam?: string;
    studyPreferences?: Record<string, unknown>;
  } | null;

  quizPerformance: {
    summary: {
      totalQuizzes: number;
      totalQuestions: number;
      totalCorrect: number;
      averageScore: number;
      overallAccuracy: number;
    };
    recentQuizzes: Array<{
      id: string;
      subject: string;
      quizType: string;
      score: number;
      accuracy: number;
      correctCount: number;
      totalQuestions: number;
      duration: number;
      completedAt: string;
    }>;
    bySubject: Array<{
      subject: string;
      quizCount: number;
      averageScore: number;
      averageAccuracy: number;
    }>;
  };

  masteryData: {
    weakTopics: Array<{
      subject: string;
      topic: string;
      masteryScore: number;
      accuracy: number;
      attempts: number;
      lastAttempt: string;
    }>;
    strongTopics: Array<{
      subject: string;
      topic: string;
      masteryScore: number;
      accuracy: number;
      attempts: number;
    }>;
  };

  strengthsWeaknesses: {
    strengths: Array<{
      subject: string;
      topic: string;
      confidence: number;
      recentAccuracy: number;
      trend: string;
      consecutiveCorrect: number;
    }>;
    weaknesses: Array<{
      subject: string;
      topic: string;
      confidence: number;
      recentAccuracy: number;
      historicalAccuracy: number;
      trend: string;
      consecutiveIncorrect: number;
      daysSinceLastAttempt: number;
    }>;
  };

  mistakeAnalysis: {
    recentMistakes: Array<{
      subject: string;
      topic?: string;
      question: string;
      selectedAnswer?: string;
      correctAnswer?: string;
      explanation?: string;
      timeSpent?: number;
      attemptedAt: string;
    }>;
    patterns: Array<{
      topic: string;
      patternType: string;
      occurrenceCount: number;
      severity: number;
      lastOccurred: string;
    }>;
  };

  learningProgress: {
    streak: {
      currentStreak: number;
      bestStreak: number;
      totalDaysStudied: number;
      lastActivityDate: string;
    } | null;
    improvements: Array<{
      topic: string;
      baselineAccuracy: number;
      currentAccuracy: number;
      improvementPercentage: number;
      daysElapsed: number;
      milestone?: string;
    }>;
    recentActivity: Array<{
      date: string;
      activityLevel: string;
      quizCount: number;
      questionCount: number;
    }>;
  };

  conversationHistory: {
    recentTopics: string[];
    totalConversations: number;
    recentMessages: Array<{
      role: string;
      content: string;
      createdAt: string;
    }>;
  } | null;

  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: number;
    topics?: string[];
  }>;
}

export interface ContextBuildOptions {
  includeProfile?: boolean;
  includeQuizHistory?: boolean;
  includeMastery?: boolean;
  includeStrengthsWeaknesses?: boolean;
  includeMistakes?: boolean;
  includeProgress?: boolean;
  includeConversations?: boolean;
  includeRecommendations?: boolean;
  
  // Limits
  quizLimit?: number;
  mistakeLimit?: number;
  conversationLimit?: number;
  activityDays?: number;
}

/**
 * Build comprehensive student context
 * SECURITY: userId must come from authenticated session
 */
export async function buildStudentContext(
  userId: string,
  options: ContextBuildOptions = {}
): Promise<StudentContext> {
  const {
    includeProfile = true,
    includeQuizHistory = true,
    includeMastery = true,
    includeStrengthsWeaknesses = true,
    includeMistakes = true,
    includeProgress = true,
    includeConversations = false,
    includeRecommendations = true,
    quizLimit = 10,
    mistakeLimit = 10,
    conversationLimit = 5,
    activityDays = 30,
  } = options;

  // Use admin client for efficient queries with proper RLS
  const supabase = await createAdminClient();

  // Parallel data fetching for performance
  const [
    profileData,
    studentProfileData,
    quizSummary,
    recentQuizzes,
    subjectPerformance,
    weakTopics,
    strongTopics,
    strengths,
    weaknesses,
    recentMistakes,
    mistakePatterns,
    streakData,
    improvements,
    recentActivity,
    conversations,
    recommendations,
  ] = await Promise.all([
    // Profile
    includeProfile
      ? supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    includeProfile
      ? supabase
          .from("student_profiles")
          .select("grade, class_name, subjects, learning_goals, target_exam, study_preferences")
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Quiz summary
    includeQuizHistory
      ? supabase
          .from("quiz_assessments")
          .select("score, accuracy, correct_answers, total_questions")
          .eq("student_id", userId)
          .not("completed_at", "is", null)
      : Promise.resolve({ data: [] }),

    // Recent quizzes
    includeQuizHistory
      ? supabase
          .from("quiz_assessments")
          .select(`
            id,
            quiz_type,
            score,
            accuracy,
            correct_answers,
            total_questions,
            duration_seconds,
            completed_at,
            subjects(name)
          `)
          .eq("student_id", userId)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(quizLimit)
      : Promise.resolve({ data: [] }),

    // Subject performance
    includeQuizHistory
      ? supabase
          .from("quiz_assessments")
          .select(`
            score,
            accuracy,
            subjects(name)
          `)
          .eq("student_id", userId)
          .not("completed_at", "is", null)
      : Promise.resolve({ data: [] }),

    // Weak topics (mastery < 60%)
    includeMastery
      ? supabase
          .from("topic_mastery")
          .select(`
            mastery_score,
            confidence,
            questions_attempted,
            questions_correct,
            last_attempt_at,
            topics(name),
            subjects(name)
          `)
          .eq("student_id", userId)
          .lt("mastery_score", 0.6)
          .order("mastery_score", { ascending: true })
          .limit(8)
      : Promise.resolve({ data: [] }),

    // Strong topics (mastery >= 80%)
    includeMastery
      ? supabase
          .from("topic_mastery")
          .select(`
            mastery_score,
            confidence,
            questions_attempted,
            questions_correct,
            topics(name),
            subjects(name)
          `)
          .eq("student_id", userId)
          .gte("mastery_score", 0.8)
          .order("mastery_score", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    // Strengths (new table)
    includeStrengthsWeaknesses
      ? supabase
          .from("student_strengths_weaknesses")
          .select(`
            confidence,
            recent_accuracy,
            trend,
            consecutive_correct,
            topics(name),
            subjects(name)
          `)
          .eq("student_id", userId)
          .eq("classification", "strength")
          .order("confidence", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    // Weaknesses (new table)
    includeStrengthsWeaknesses
      ? supabase
          .from("student_strengths_weaknesses")
          .select(`
            confidence,
            recent_accuracy,
            historical_accuracy,
            trend,
            consecutive_incorrect,
            days_since_last_attempt,
            topics(name),
            subjects(name)
          `)
          .eq("student_id", userId)
          .eq("classification", "weakness")
          .order("confidence", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),

    // Recent mistakes
    includeMistakes
      ? supabase
          .from("quiz_answers")
          .select(`
            selected_answer_index,
            time_spent_seconds,
            created_at,
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

    // Mistake patterns
    includeMistakes
      ? supabase
          .from("mistake_patterns")
          .select(`
            pattern_type,
            occurrence_count,
            severity,
            last_occurred_at,
            topics(name)
          `)
          .eq("student_id", userId)
          .order("severity", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    // Learning streak
    includeProgress
      ? supabase
          .from("learning_streaks")
          .select("current_streak, best_streak, total_days_studied, last_activity_date")
          .eq("student_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Improvement tracking
    includeProgress
      ? supabase
          .from("improvement_tracking")
          .select(`
            baseline_accuracy,
            current_accuracy,
            improvement_percentage,
            days_elapsed,
            milestone,
            topics(name)
          `)
          .eq("student_id", userId)
          .gt("improvement_percentage", 10)
          .order("improvement_percentage", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    // Recent activity
    includeProgress
      ? supabase
          .from("daily_activity_summary")
          .select("activity_date, activity_level, quiz_count, question_count")
          .eq("student_id", userId)
          .gte("activity_date", new Date(Date.now() - activityDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .order("activity_date", { ascending: false })
          .limit(activityDays)
      : Promise.resolve({ data: [] }),

    // Conversations
    includeConversations
      ? supabase
          .from("conversations")
          .select(`
            id,
            title,
            created_at,
            messages(role, content, created_at)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(conversationLimit)
      : Promise.resolve({ data: [] }),

    // Recommendations
    includeRecommendations
      ? supabase
          .from("quiz_recommendations")
          .select(`
            recommendation_type,
            title,
            description,
            priority,
            topic_ids
          `)
          .eq("student_id", userId)
          .is("dismissed_at", null)
          .is("acted_on_at", null)
          .order("priority", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  // Process profile
  const profile = profileData.data && studentProfileData.data
    ? {
        displayName: profileData.data.display_name,
        username: profileData.data.username,
        grade: studentProfileData.data.grade,
        className: studentProfileData.data.class_name,
        subjects: studentProfileData.data.subjects,
        goals: studentProfileData.data.learning_goals,
        targetExam: studentProfileData.data.target_exam,
        studyPreferences: studentProfileData.data.study_preferences,
      }
    : null;

  // Process quiz performance
  const quizzes = quizSummary.data || [];
  const totalCorrect = quizzes.reduce((sum, q) => sum + (q.correct_answers || 0), 0);
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.total_questions || 0), 0);

  const quizPerformance = {
    summary: {
      totalQuizzes: quizzes.length,
      totalQuestions,
      totalCorrect,
      averageScore: quizzes.length > 0 
        ? Math.round(quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizzes.length)
        : 0,
      overallAccuracy: quizzes.length > 0
        ? Math.round(quizzes.reduce((sum, q) => sum + (q.accuracy || 0), 0) / quizzes.length)
        : 0,
    },
    recentQuizzes: (recentQuizzes.data || []).map((q) => {
      const subjects = q.subjects as unknown as {name?: string};
      return {
        id: q.id,
        subject: subjects?.name || "Unknown",
        quizType: q.quiz_type || "unknown",
        score: Math.round(q.score || 0),
        accuracy: Math.round(q.accuracy || 0),
        correctCount: q.correct_answers || 0,
        totalQuestions: q.total_questions || 0,
        duration: q.duration_seconds || 0,
        completedAt: q.completed_at,
      };
    }),
    bySubject: aggregateBySubject(subjectPerformance.data || []),
  };

  // Process mastery data
  const masteryData = {
    weakTopics: (weakTopics.data || []).map((t) => {
      const subjects = t.subjects as unknown as {name?: string};
      const topics = t.topics as unknown as {name?: string};
      return {
        subject: subjects?.name || "Unknown",
        topic: topics?.name || "Unknown",
        masteryScore: Math.round((t.mastery_score || 0) * 100),
        accuracy: t.questions_attempted > 0
          ? Math.round((t.questions_correct / t.questions_attempted) * 100)
          : 0,
        attempts: t.questions_attempted || 0,
        lastAttempt: t.last_attempt_at,
      };
    }),
    strongTopics: (strongTopics.data || []).map((t) => {
      const subjects = t.subjects as unknown as {name?: string};
      const topics = t.topics as unknown as {name?: string};
      return {
        subject: subjects?.name || "Unknown",
        topic: topics?.name || "Unknown",
        masteryScore: Math.round((t.mastery_score || 0) * 100),
        accuracy: t.questions_attempted > 0
          ? Math.round((t.questions_correct / t.questions_attempted) * 100)
          : 100,
        attempts: t.questions_attempted || 0,
      };
    }),
  };

  // Process strengths/weaknesses
  const strengthsWeaknesses = {
    strengths: (strengths.data || []).map((s) => {
      const subjects = s.subjects as unknown as {name?: string};
      const topics = s.topics as unknown as {name?: string};
      return {
        subject: subjects?.name || "Unknown",
        topic: topics?.name || "Unknown",
        confidence: Math.round((s.confidence || 0) * 100),
        recentAccuracy: Math.round((s.recent_accuracy || 0) * 100),
        trend: s.trend || "unknown",
        consecutiveCorrect: s.consecutive_correct || 0,
      };
    }),
    weaknesses: (weaknesses.data || []).map((w) => {
      const subjects = w.subjects as unknown as {name?: string};
      const topics = w.topics as unknown as {name?: string};
      return {
        subject: subjects?.name || "Unknown",
        topic: topics?.name || "Unknown",
        confidence: Math.round((w.confidence || 0) * 100),
        recentAccuracy: Math.round((w.recent_accuracy || 0) * 100),
        historicalAccuracy: Math.round((w.historical_accuracy || 0) * 100),
        trend: w.trend || "unknown",
        consecutiveIncorrect: w.consecutive_incorrect || 0,
        daysSinceLastAttempt: w.days_since_last_attempt || 0,
      };
    }),
  };

  // Process mistakes
  const mistakeAnalysis = {
    recentMistakes: (recentMistakes.data || []).map((m) => {
      const question = m.quiz_questions as unknown as {question_text?: string; options?: string[]; correct_answer_index?: number; explanation?: string; topic?: string};
      const quizAssessment = m.quiz_assessments as unknown as {subjects?: {name?: string}};
      
      return {
        subject: quizAssessment?.subjects?.name || "Unknown",
        topic: question?.topic,
        question: question?.question_text || "N/A",
        selectedAnswer: question?.options?.[m.selected_answer_index],
        correctAnswer: question?.options?.[question?.correct_answer_index || 0],
        explanation: question?.explanation,
        timeSpent: m.time_spent_seconds,
        attemptedAt: m.created_at,
      };
    }),
    patterns: (mistakePatterns.data || []).map((p) => {
      const topics = p.topics as unknown as {name?: string};
      return {
        topic: topics?.name || "Unknown",
        patternType: p.pattern_type || "unknown",
        occurrenceCount: p.occurrence_count || 0,
        severity: Math.round((p.severity || 0) * 100),
        lastOccurred: p.last_occurred_at,
      };
    }),
  };

  // Process learning progress
  const learningProgress = {
    streak: streakData.data
      ? {
          currentStreak: streakData.data.current_streak || 0,
          bestStreak: streakData.data.best_streak || 0,
          totalDaysStudied: streakData.data.total_days_studied || 0,
          lastActivityDate: streakData.data.last_activity_date,
        }
      : null,
    improvements: (improvements.data || []).map((i) => {
      const topics = i.topics as unknown as {name?: string};
      return {
        topic: topics?.name || "Unknown",
        baselineAccuracy: Math.round((i.baseline_accuracy || 0) * 100),
        currentAccuracy: Math.round((i.current_accuracy || 0) * 100),
        improvementPercentage: Math.round(i.improvement_percentage || 0),
        daysElapsed: i.days_elapsed || 0,
        milestone: i.milestone,
      };
    }),
    recentActivity: (recentActivity.data || []).map((a) => ({
      date: a.activity_date,
      activityLevel: a.activity_level || "none",
      quizCount: a.quiz_count || 0,
      questionCount: a.question_count || 0,
    })),
  };

  // Process conversations
  const conversationHistory = conversations.data && conversations.data.length > 0
    ? {
        totalConversations: conversations.data.length,
        recentTopics: conversations.data.map((c) => c.title).filter(Boolean),
        recentMessages: conversations.data
          .flatMap((c) => c.messages || [])
          .slice(0, 10)
          .map((m) => ({
            role: m.role,
            content: m.content.slice(0, 200),
            createdAt: m.created_at,
          })),
      }
    : null;

  // Process recommendations
  const processedRecommendations = (recommendations.data || []).map((r) => ({
    type: r.recommendation_type || "unknown",
    title: r.title || "",
    description: r.description || "",
    priority: r.priority || 5,
    topics: r.topic_ids || [],
  }));

  return {
    profile,
    quizPerformance,
    masteryData,
    strengthsWeaknesses,
    mistakeAnalysis,
    learningProgress,
    conversationHistory,
    recommendations: processedRecommendations,
  };
}

/**
 * Aggregate quiz performance by subject
 */
function aggregateBySubject(data: Array<{subjects?: unknown; score?: number; accuracy?: number}>): Array<{
  subject: string;
  quizCount: number;
  averageScore: number;
  averageAccuracy: number;
}> {
  const bySubject = new Map<string, { scores: number[]; accuracies: number[] }>();

  for (const quiz of data) {
    const subjects = quiz.subjects as unknown as {name?: string};
    const subject = subjects?.name || "Unknown";
    
    if (!bySubject.has(subject)) {
      bySubject.set(subject, { scores: [], accuracies: [] });
    }
    const subjectData = bySubject.get(subject)!;
    subjectData.scores.push(quiz.score || 0);
    subjectData.accuracies.push(quiz.accuracy || 0);
  }

  return Array.from(bySubject.entries()).map(([subject, data]) => ({
    subject,
    quizCount: data.scores.length,
    averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    averageAccuracy: Math.round(data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length),
  }));
}

/**
 * Format comprehensive context for AI prompt
 * Structures data in clear, parseable format for LLM
 */
export function formatStudentContextForAI(context: StudentContext): string {
  const sections: string[] = [];

  // Profile
  if (context.profile) {
    sections.push(`<student_profile>
Tên: ${context.profile.displayName || context.profile.username || "N/A"}
Lớp: ${context.profile.grade || "N/A"}${context.profile.className ? ` - ${context.profile.className}` : ""}
Môn học: ${context.profile.subjects?.join(", ") || "N/A"}
Mục tiêu: ${context.profile.goals || "Chưa thiết lập"}
Kỳ thi: ${context.profile.targetExam || "Chưa xác định"}
</student_profile>`);
  }

  // Quiz performance summary
  if (context.quizPerformance.summary.totalQuizzes > 0) {
    const summary = context.quizPerformance.summary;
    sections.push(`<quiz_summary>
Tổng số quiz: ${summary.totalQuizzes}
Tổng số câu hỏi: ${summary.totalQuestions} (đúng: ${summary.totalCorrect})
Điểm trung bình: ${summary.averageScore}%
Độ chính xác: ${summary.overallAccuracy}%
</quiz_summary>`);

    // By subject
    if (context.quizPerformance.bySubject.length > 0) {
      const bySubject = context.quizPerformance.bySubject
        .map(s => `- ${s.subject}: ${s.averageScore}% (${s.quizCount} quiz, accuracy ${s.averageAccuracy}%)`)
        .join("\n");
      sections.push(`<performance_by_subject>\n${bySubject}\n</performance_by_subject>`);
    }

    // Recent quizzes
    if (context.quizPerformance.recentQuizzes.length > 0) {
      const recent = context.quizPerformance.recentQuizzes.slice(0, 5)
        .map(q => `- ${q.subject} (${q.quizType}): ${q.correctCount}/${q.totalQuestions} (${q.accuracy}%, ${Math.round(q.duration / 60)}phút) - ${formatDate(q.completedAt)}`)
        .join("\n");
      sections.push(`<recent_quizzes>\n${recent}\n</recent_quizzes>`);
    }
  }

  // Learning streak
  if (context.learningProgress.streak) {
    const streak = context.learningProgress.streak;
    sections.push(`<learning_streak>
Chuỗi học hiện tại: ${streak.currentStreak} ngày
Chuỗi học tốt nhất: ${streak.bestStreak} ngày
Tổng số ngày học: ${streak.totalDaysStudied} ngày
Hoạt động gần nhất: ${formatDate(streak.lastActivityDate)}
</learning_streak>`);
  }

  // Strengths
  if (context.strengthsWeaknesses.strengths.length > 0) {
    const strengths = context.strengthsWeaknesses.strengths
      .map(s => `- ${s.subject} — ${s.topic}: ${s.recentAccuracy}% (confidence: ${s.confidence}%, trend: ${s.trend}, streak: ${s.consecutiveCorrect} đúng liên tiếp)`)
      .join("\n");
    sections.push(`<strengths>\n${strengths}\n</strengths>`);
  }

  // Weaknesses
  if (context.strengthsWeaknesses.weaknesses.length > 0) {
    const weaknesses = context.strengthsWeaknesses.weaknesses
      .map(w => `- ${w.subject} — ${w.topic}: ${w.recentAccuracy}% gần đây vs ${w.historicalAccuracy}% trước đó (confidence: ${w.confidence}%, trend: ${w.trend}, ${w.daysSinceLastAttempt} ngày chưa luyện)`)
      .join("\n");
    sections.push(`<weaknesses>\n${weaknesses}\n</weaknesses>`);
  }

  // Weak topics (from mastery)
  if (context.masteryData.weakTopics.length > 0) {
    const weak = context.masteryData.weakTopics
      .map(t => `- ${t.subject} — ${t.topic}: mastery ${t.masteryScore}%, accuracy ${t.accuracy}% (${t.attempts} lần thử)`)
      .join("\n");
    sections.push(`<weak_topics>\n${weak}\n</weak_topics>`);
  }

  // Recent mistakes
  if (context.mistakeAnalysis.recentMistakes.length > 0) {
    const mistakes = context.mistakeAnalysis.recentMistakes.slice(0, 5)
      .map((m, i) => {
        let text = `${i + 1}. ${m.subject}${m.topic ? ` — ${m.topic}` : ""}\n   Câu: ${m.question.substring(0, 120)}${m.question.length > 120 ? "..." : ""}`;
        if (m.selectedAnswer && m.correctAnswer) {
          text += `\n   Chọn: ${m.selectedAnswer}\n   Đúng: ${m.correctAnswer}`;
        }
        return text;
      })
      .join("\n\n");
    sections.push(`<recent_mistakes>\n${mistakes}\n</recent_mistakes>`);
  }

  // Mistake patterns
  if (context.mistakeAnalysis.patterns.length > 0) {
    const patterns = context.mistakeAnalysis.patterns
      .map(p => `- ${p.topic}: ${p.patternType} (${p.occurrenceCount} lần, severity ${p.severity}%)`)
      .join("\n");
    sections.push(`<mistake_patterns>\n${patterns}\n</mistake_patterns>`);
  }

  // Improvements
  if (context.learningProgress.improvements.length > 0) {
    const improvements = context.learningProgress.improvements
      .map(i => `- ${i.topic}: ${i.baselineAccuracy}% → ${i.currentAccuracy}% (+${i.improvementPercentage}% trong ${i.daysElapsed} ngày)${i.milestone ? ` [${i.milestone}]` : ""}`)
      .join("\n");
    sections.push(`<improvements>\n${improvements}\n</improvements>`);
  }

  // Recommendations
  if (context.recommendations.length > 0) {
    const recs = context.recommendations
      .map(r => `- [P${r.priority}] ${r.title}: ${r.description}`)
      .join("\n");
    sections.push(`<recommendations>\n${recs}\n</recommendations>`);
  }

  return sections.join("\n\n");
}

/**
 * Format date for Vietnamese display
 */
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}
