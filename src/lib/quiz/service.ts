"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";
import { createCompletion } from "@/lib/ai/provider";
import { generateAdaptiveRecommendation } from "@/lib/mastery/service";
import { retryTransientAIRequest } from "@/lib/ai/retry";
import { parseAIJSON } from "./json-parser";
import { validateQuizSemantics } from "./normalize";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
}

export interface QuizAssessment {
  id: string;
  student_id: string;
  subject_id: string | null;
  quiz_type: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  accuracy: number;
  duration_seconds: number | null;
  difficulty_level: string | null;
  created_at: string;
  completed_at: string | null;
}

const quizGenerationSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(1),
      options: z.array(z.string().min(1)).length(4),
      correctAnswer: z.number().int().min(0).max(3),
      explanation: z.string().default(""),
      subject: z.string().default(""),
      topic: z.string().default(""),
      difficulty: z.string().default("basic"),
    })
  ).min(1),
});

const quizJSONSchema = {
  name: "quiz_generation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4,
            },
            correctAnswer: { type: "integer", minimum: 0, maximum: 3 },
            explanation: { type: "string" },
            subject: { type: "string" },
            topic: { type: "string" },
            difficulty: { type: "string" },
          },
          required: ["question", "options", "correctAnswer", "explanation", "subject", "topic", "difficulty"],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  },
};

async function repairQuizJSONWithAI(malformedContent: string): Promise<QuizQuestion[] | null> {
  const repairPrompt = `Repair ONLY JSON syntax.

Do not change:
- question text
- options
- correct answers
- feedback
- hints
- meaning
- ordering

Only fix:
- invalid JSON escaping
- missing commas
- missing brackets
- missing braces
- invalid string escaping

Return ONLY valid JSON.

Malformed JSON to repair:
${malformedContent}`;

  try {
    const { result } = await retryTransientAIRequest(() =>
      createCompletion(
        {
          messages: [{ role: "user", content: repairPrompt }],
          temperature: 0.1,
          maxTokens: 4000,
          responseFormat: "json_object",
        },
        { maxTokens: 4000 }
      )
    );

    const parseResult = parseAIJSON<{ questions: unknown }>(result.content || "");
    if (!parseResult.success || !parseResult.data) {
      return null;
    }

    const validation = validateQuizSemantics(parseResult.data);
    return validation.valid && validation.questions ? validation.questions : null;
  } catch (err) {
    console.error("AI JSON repair failed:", err);
    return null;
  }
}

async function executeQuizGenerationPipeline(
  prompt: string,
  maxRetries = 2
): Promise<{ success: boolean; questions?: QuizQuestion[]; error?: string }> {
  let lastError = "Không thể tạo Quick Quiz lúc này. Hãy thử lại.";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Step 1: Call completion prioritizing structured output schema
      const { result: response } = await retryTransientAIRequest(() =>
        createCompletion(
          {
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            maxTokens: 4000,
            responseFormat: {
              type: "json_schema",
              json_schema: quizJSONSchema,
            },
          },
          { maxTokens: 4000 }
        )
      );

      const content = response.content || "";

      // Step 2: Attempt safe JSON parsing
      const parseResult = parseAIJSON<{ questions: unknown }>(content);

      if (parseResult.success && parseResult.data) {
        // Validate with Zod schema
        const parsed = quizGenerationSchema.safeParse(parseResult.data);
        if (parsed.success) {
          // Semantic validation
          const semantic = validateQuizSemantics(parsed.data);
          if (semantic.valid && semantic.questions) {
            return { success: true, questions: semantic.questions };
          }
        }
      }

      // If direct parsing or schema failed, log in development
      if (process.env.NODE_ENV === "development") {
        console.warn(`[QuickQuiz] Generation attempt ${attempt + 1} parse/validate failed, trying repair...`, {
          error: parseResult.error,
          rawPreview: content.substring(0, 300),
        });
      }

      // Step 3 (Attempt 2 in spec): Call repair LLM fallback
      const repairedQuestions = await repairQuizJSONWithAI(content);
      if (repairedQuestions && repairedQuestions.length > 0) {
        return { success: true, questions: repairedQuestions };
      }

      lastError = parseResult.error || "Dữ liệu quiz không đúng định dạng";
    } catch (err) {
      console.error(`[QuickQuiz] Generation error attempt ${attempt + 1}:`, err);
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  // All attempts exhausted
  const userError =
    process.env.NODE_ENV === "production"
      ? "Không thể tạo Quick Quiz lúc này. Hãy thử lại."
      : `Lỗi parse JSON: ${lastError}`;

  return { success: false, error: userError };
}

export async function generateQuiz({
  subject,
  difficulty,
  numberOfQuestions,
  topics,
}: {
  subject: string;
  difficulty: "basic" | "intermediate" | "advanced";
  numberOfQuestions: number;
  topics?: string[];
}): Promise<{ success: boolean; questions?: QuizQuestion[]; error?: string }> {
  await requireAuth();

  const difficultyMap = {
    basic: "cơ bản (dành cho học sinh mới bắt đầu)",
    intermediate: "trung bình (dành cho học sinh đã có nền tảng)",
    advanced: "nâng cao (dành cho học sinh giỏi)",
  };

  const topicsPrompt = topics && topics.length > 0 
    ? `Tập trung vào các chủ đề sau: ${topics.join(", ")}.` 
    : "";

  const prompt = `Bạn là một chuyên gia giáo dục. Tạo ${numberOfQuestions} câu hỏi trắc nghiệm cho môn ${subject} ở mức độ ${difficultyMap[difficulty]}.

${topicsPrompt}

Yêu cầu nội dung:
- Mỗi câu có đúng 4 đáp án
- Chỉ 1 đáp án đúng (correctAnswer là số nguyên từ 0 đến 3)
- Câu hỏi phải chính xác, rõ ràng
- Giải thích ngắn gọn tại sao đáp án đúng
- Phù hợp với chương trình THPT Việt Nam

QUAN TRỌNG - Ký hiệu Toán/Lý/Hóa:
- Khi ký hiệu toán học không bắt buộc phải dùng LaTeX, ƯU TIÊN dùng ký tự Unicode: √, ², ³, Δ, π, θ, ≤, ≥, →, ×, ÷, H₂O, CO₂, SO₄²⁻, Fe³⁺, v = Δs/Δt, F = ma, U = IR, λ = v/f.
- Chỉ dùng LaTeX khi công thức thực sự phức tạp (như tích phân nhiều biến, phân số nhiều tầng).
- Nếu dùng LaTeX: MỌI backslash đều phải viết thành double backslash: \\\\frac{a}{b}, \\\\sqrt{x}.

QUY TẮC JSON BẮT BUỘC:
Return ONLY valid JSON.
Do not return Markdown.
Do not wrap the JSON in \`\`\`json fences.
All string values must be valid JSON strings.
Escape every double quote inside strings as \\".
Escape every literal backslash as \\\\.
Never emit invalid JSON escapes such as \\frac, \\sqrt, \\alpha, \\beta, \\Delta.
Before returning:
- verify balanced {}
- verify balanced []
- verify every string is closed
- verify commas
- verify no trailing commas
- verify all backslashes are valid JSON escapes
- verify correctAnswer is an integer (0, 1, 2, or 3)
- verify every required field

RESPONSE FORMAT - Trả về ĐÚNG định dạng JSON sau (KHÔNG có text hay markdown ngoài JSON):
{
  "questions": [
    {
      "question": "Nội dung câu hỏi",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": 0,
      "explanation": "Giải thích",
      "subject": "${subject}",
      "topic": "Tên chủ đề",
      "difficulty": "${difficulty}"
    }
  ]
}`;

  return executeQuizGenerationPipeline(prompt);
}

export async function generatePersonalizedQuiz({
  subject,
  numberOfQuestions,
}: {
  subject: string;
  numberOfQuestions: number;
}): Promise<{ success: boolean; questions?: QuizQuestion[]; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch student's weak concepts
  const { data: weakConcepts } = await supabase
    .from("student_mastery")
    .select("concept_id, mastery_level, concepts(name, topics(name))")
    .eq("student_id", user.id)
    .lt("mastery_level", 0.7)
    .order("mastery_level", { ascending: true })
    .limit(5);

  // Fetch recent mistakes
  const { data: recentMistakes } = await supabase
    .from("mistakes")
    .select("concept_id, error_type, concepts(name)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Build topics to focus on
  const weakTopics: string[] = [];
  if (weakConcepts && weakConcepts.length > 0) {
    weakConcepts.forEach((wc: any) => {
      if (wc.concepts?.name) {
        weakTopics.push(wc.concepts.name);
      }
    });
  }

  // Determine difficulty based on average mastery
  let difficulty: "basic" | "intermediate" | "advanced" = "intermediate";
  if (weakConcepts && weakConcepts.length > 0) {
    const avgMastery = weakConcepts.reduce((sum: number, c: any) => sum + (c.mastery_level || 0), 0) / weakConcepts.length;
    if (avgMastery < 0.4) {
      difficulty = "basic";
    } else if (avgMastery >= 0.6) {
      difficulty = "intermediate";
    }
  }

  const contextPrompt = weakTopics.length > 0
    ? `Học sinh đang gặp khó khăn với: ${weakTopics.join(", ")}. Tập trung nhiều câu hỏi vào những phần này.`
    : "";

  const prompt = `Bạn là một chuyên gia giáo dục. Tạo ${numberOfQuestions} câu hỏi trắc nghiệm CÁ NHÂN HÓA cho học sinh về môn ${subject}.

${contextPrompt}

Yêu cầu nội dung:
- Mỗi câu có đúng 4 đáp án
- Chỉ 1 đáp án đúng (correctAnswer là số nguyên từ 0 đến 3)
- Câu hỏi phải giúp học sinh cải thiện điểm yếu
- Độ khó phù hợp: ${difficulty}
- Giải thích chi tiết để học sinh hiểu
- Phù hợp với chương trình THPT Việt Nam

QUAN TRỌNG - Ký hiệu Toán/Lý/Hóa:
- Khi ký hiệu toán học không bắt buộc phải dùng LaTeX, ƯU TIÊN dùng ký tự Unicode: √, ², ³, Δ, π, θ, ≤, ≥, →, ×, ÷, H₂O, CO₂, SO₄²⁻, Fe³⁺, v = Δs/Δt, F = ma, U = IR, λ = v/f.
- Chỉ dùng LaTeX khi công thức thực sự phức tạp (như tích phân nhiều biến, phân số nhiều tầng).
- Nếu dùng LaTeX: MỌI backslash đều phải viết thành double backslash: \\\\frac{a}{b}, \\\\sqrt{x}.

QUY TẮC JSON BẮT BUỘC:
Return ONLY valid JSON.
Do not return Markdown.
Do not wrap the JSON in \`\`\`json fences.
All string values must be valid JSON strings.
Escape every double quote inside strings as \\".
Escape every literal backslash as \\\\.
Never emit invalid JSON escapes such as \\frac, \\sqrt, \\alpha, \\beta, \\Delta.
Before returning:
- verify balanced {}
- verify balanced []
- verify every string is closed
- verify commas
- verify no trailing commas
- verify all backslashes are valid JSON escapes
- verify correctAnswer is an integer (0, 1, 2, or 3)
- verify every required field

RESPONSE FORMAT - Trả về ĐÚNG định dạng JSON sau (KHÔNG có text hay markdown ngoài JSON):
{
  "questions": [
    {
      "question": "Nội dung câu hỏi",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": 0,
      "explanation": "Giải thích chi tiết",
      "subject": "${subject}",
      "topic": "Tên chủ đề",
      "difficulty": "${difficulty}"
    }
  ]
}`;

  return executeQuizGenerationPipeline(prompt);
}

export async function createQuizAssessment({
  subjectId,
  quizType,
  totalQuestions,
  difficultyLevel,
  classId,
  questions,
}: {
  subjectId?: string;
  quizType: "personalized" | "quick_assessment" | "topic_review";
  totalQuestions: number;
  difficultyLevel?: "basic" | "intermediate" | "advanced" | "adaptive";
  classId?: string;
  questions?: QuizQuestion[];
}): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_assessments")
    .insert({
      student_id: user.id,
      subject_id: subjectId || null,
      class_id: classId || null,
      quiz_type: quizType,
      total_questions: totalQuestions,
      correct_answers: 0,
      score: 0,
      accuracy: 0,
      difficulty_level: difficultyLevel || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Không thể tạo assessment" };
  }

  // Save quiz questions to database if provided
  if (questions && questions.length > 0) {
    const questionRecords = questions.map((q: any, index: number) => {
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      let correctAnswerIdx = typeof q.correctAnswer === "number" ? q.correctAnswer : 0;

      if (q.correctOptionId && rawOptions.length > 0) {
        const foundIdx = rawOptions.findIndex((opt: any) =>
          typeof opt === "object" && opt !== null ? opt.id === q.correctOptionId : false
        );
        if (foundIdx >= 0) {
          correctAnswerIdx = foundIdx;
        }
      }

      correctAnswerIdx = Math.max(0, Math.min(3, correctAnswerIdx));

      return {
        assessment_id: data.id,
        question_text: q.question,
        options: rawOptions.map((o: any) => typeof o === "string" ? o : o.text || String(o)),
        correct_answer_index: correctAnswerIdx,
        explanation: q.explanation || "",
        topic: q.topic || "",
        difficulty: q.difficulty || "basic",
        question_order: index,
      };
    });

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionRecords);

    if (questionsError) {
      console.error("Failed to save quiz questions:", questionsError);
      // Delete the assessment if questions failed to save
      await supabase.from("quiz_assessments").delete().eq("id", data.id);
      return { success: false, error: "Không thể lưu câu hỏi quiz" };
    }
  }

  return { success: true, assessmentId: data.id };
}

export async function submitQuizAnswer({
  assessmentId,
  quizQuestionId,
  selectedAnswerIndex,
  selectedOptionId,
  timeSpent,
}: {
  assessmentId: string;
  quizQuestionId: string;
  selectedAnswerIndex?: number;
  selectedOptionId?: string;
  timeSpent?: number;
}): Promise<{ success: boolean; isCorrect?: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Verify assessment belongs to user
    const { data: assessment } = await supabase
      .from("quiz_assessments")
      .select("id, student_id")
      .eq("id", assessmentId)
      .eq("student_id", user.id)
      .single();

    if (!assessment) {
      return { success: false, error: "Assessment not found" };
    }

    // Gracefully handle temporary or non-UUID question IDs (e.g. offline/sessionStorage fallback)
    if (quizQuestionId.startsWith("temp_")) {
      return { success: true, isCorrect: true };
    }

    // SERVER-SIDE GRADING: Get correct answer from database
    const { data: question } = await supabase
      .from("quiz_questions")
      .select("id, correct_answer_index, topic, difficulty, options")
      .eq("id", quizQuestionId)
      .eq("assessment_id", assessmentId)
      .single();

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Resolve answer index
    let resolvedIndex = typeof selectedAnswerIndex === "number" ? selectedAnswerIndex : -1;
    if (selectedOptionId && Array.isArray(question.options)) {
      const matchIdx = question.options.findIndex((opt: any, idx: number) => {
        if (typeof opt === "object" && opt !== null) {
          return opt.id === selectedOptionId;
        }
        return `${question.id}_opt_${idx}` === selectedOptionId;
      });
      if (matchIdx !== -1) {
        resolvedIndex = matchIdx;
      }
    }

    if (resolvedIndex < 0 || resolvedIndex >= question.options.length) {
      resolvedIndex = 0;
    }

    // SERVER-SIDE VALIDATION: Calculate isCorrect
    const isCorrect = resolvedIndex === question.correct_answer_index;
    const selectedOpt = question.options[resolvedIndex];
    const selectedAnswerText = typeof selectedOpt === "string" ? selectedOpt : (selectedOpt?.text || "");

    // Store answer with metadata for mastery tracking
    const metadata: Record<string, any> = {};
    if (question.topic) metadata.topic = question.topic;
    if (question.difficulty) metadata.difficulty = question.difficulty;

    const { error } = await supabase.from("quiz_answers").insert({
      assessment_id: assessmentId,
      quiz_question_id: quizQuestionId,
      question_id: null, // Not using old questions table
      selected_answer: selectedAnswerText, // Keep for backward compatibility
      selected_answer_index: resolvedIndex,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent || null,
      metadata,
    });

    if (error) {
      console.error("Failed to save quiz answer:", error);
      return { success: false, error: "Không thể lưu câu trả lời" };
    }

    return { success: true, isCorrect };
  } catch (err) {
    console.error("Error in submitQuizAnswer:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function completeQuizAssessment({
  assessmentId,
  durationSeconds,
}: {
  assessmentId: string;
  durationSeconds: number;
}): Promise<{ success: boolean; assessment?: QuizAssessment; error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get all answers for this assessment
  const { data: answers } = await supabase
    .from("quiz_answers")
    .select("is_correct")
    .eq("assessment_id", assessmentId);

  if (!answers) {
    return { success: false, error: "Không tìm thấy câu trả lời" };
  }

  const totalQuestions = answers.length;
  const correctAnswers = answers.filter((a) => a.is_correct).length;
  const wrongAnswers = totalQuestions - correctAnswers;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const score = accuracy;

  // VALIDATION: Ensure data integrity
  if (correctAnswers + wrongAnswers !== totalQuestions) {
    console.error("Quiz grading validation failed:", {
      total: totalQuestions,
      correct: correctAnswers,
      wrong: wrongAnswers,
    });
    return { 
      success: false, 
      error: "Lỗi tính điểm: Tổng câu không khớp" 
    };
  }

  // DEBUG LOG in development
  if (process.env.NODE_ENV === "development") {
    console.log("Quiz grading validation:", {
      total: totalQuestions,
      correct: correctAnswers,
      wrong: wrongAnswers,
      percentage: Math.round(accuracy),
    });
  }

  const { data, error } = await supabase
    .from("quiz_assessments")
    .update({
      correct_answers: correctAnswers,
      score,
      accuracy,
      duration_seconds: durationSeconds,
      completed_at: new Date().toISOString(),
    })
    .eq("id", assessmentId)
    .eq("student_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to complete assessment:", error);
    return { success: false, error: "Không thể hoàn thành assessment" };
  }

  // Verify the saved data matches our calculation
  if (data.correct_answers !== correctAnswers || Math.abs(data.accuracy - accuracy) > 0.01) {
    console.error("Score mismatch after save:", {
      calculated: { correct: correctAnswers, accuracy },
      saved: { correct: data.correct_answers, accuracy: data.accuracy },
    });
  }

  // Run topic mastery and recommendations updates in background without blocking response
  updateTopicMasteryFromQuiz(assessmentId, user.id).catch((err) => {
    console.error("Background topic mastery update failed:", err);
  });

  generateLearningRecommendations(assessmentId, user.id).catch((err) => {
    console.error("Background recommendations generation failed:", err);
  });

  return { success: true, assessment: data };
}

export async function getQuizAssessments(
  limit = 20
): Promise<QuizAssessment[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_assessments")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getRecommendedDifficulty(
  subjectId: string
): Promise<"basic" | "intermediate" | "advanced"> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get recent quiz performance for this subject
  const { data: recentQuizzes } = await supabase
    .from("quiz_assessments")
    .select("accuracy, difficulty_level")
    .eq("student_id", user.id)
    .eq("subject_id", subjectId)
    .not("completed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get topic mastery for this subject
  const { data: topicMastery } = await supabase
    .from("topic_mastery")
    .select("mastery_score")
    .eq("student_id", user.id)
    .eq("subject_id", subjectId);

  // Calculate average mastery
  let avgMastery = 0.5; // Default to intermediate
  
  if (topicMastery && topicMastery.length > 0) {
    avgMastery = topicMastery.reduce((sum, t) => sum + t.mastery_score, 0) / topicMastery.length;
  } else if (recentQuizzes && recentQuizzes.length > 0) {
    // Use recent quiz performance if no mastery data
    avgMastery = recentQuizzes.reduce((sum, q) => sum + (q.accuracy / 100), 0) / recentQuizzes.length;
  }

  // Determine difficulty based on mastery
  // < 0.5 = basic, 0.5-0.75 = intermediate, > 0.75 = advanced
  if (avgMastery < 0.5) {
    return "basic";
  } else if (avgMastery >= 0.75) {
    // Check if they're consistently doing well at advanced level
    const recentAdvanced = recentQuizzes?.filter(q => q.difficulty_level === "advanced") || [];
    if (recentAdvanced.length >= 2) {
      const advancedAvg = recentAdvanced.reduce((sum, q) => sum + q.accuracy, 0) / recentAdvanced.length;
      if (advancedAvg >= 70) {
        return "advanced";
      }
    }
    // If not consistently good at advanced, recommend intermediate
    return avgMastery >= 0.8 ? "advanced" : "intermediate";
  }
  
  return "intermediate";
}

async function updateTopicMasteryFromQuiz(
  assessmentId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient();

  // Get assessment with subject info
  const { data: assessment } = await supabase
    .from("quiz_assessments")
    .select("subject_id, accuracy")
    .eq("id", assessmentId)
    .single();

  if (!assessment || !assessment.subject_id) {
    return;
  }

  // Get all answers with metadata (topic information)
  const { data: answers } = await supabase
    .from("quiz_answers")
    .select("is_correct, metadata")
    .eq("assessment_id", assessmentId);

  if (!answers || answers.length === 0) {
    return;
  }

  // Group answers by topic
  const topicStats: Record<string, { correct: number; total: number }> = {};
  
  for (const answer of answers) {
    const topic = answer.metadata?.topic;
    if (!topic) continue;

    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 };
    }
    
    topicStats[topic].total += 1;
    if (answer.is_correct) {
      topicStats[topic].correct += 1;
    }
  }

  // Update mastery for each topic
  for (const [topicName, stats] of Object.entries(topicStats)) {
    const topicAccuracy = stats.total > 0 ? stats.correct / stats.total : 0;

    // Find topic by name in the subject
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", assessment.subject_id)
      .ilike("name", `%${topicName}%`)
      .limit(1)
      .single();

    if (!topic) {
      // If topic not found, skip (could be a generated topic name)
      continue;
    }

    // Check if mastery record exists
    const { data: existingMastery } = await supabase
      .from("topic_mastery")
      .select("*")
      .eq("student_id", studentId)
      .eq("subject_id", assessment.subject_id)
      .eq("topic_id", topic.id)
      .maybeSingle();

    // Calculate new mastery using exponential moving average
    // New performance has more weight if confidence is low
    const weight = existingMastery ? 0.3 : 1.0;
    const oldScore = existingMastery?.mastery_score || 0;
    const newScore = oldScore * (1 - weight) + topicAccuracy * weight;

    if (existingMastery) {
      // Update existing record
      await supabase
        .from("topic_mastery")
        .update({
          mastery_score: newScore,
          confidence: Math.min((existingMastery.questions_attempted + stats.total) / 20, 1), // Confidence increases with more attempts
          questions_attempted: existingMastery.questions_attempted + stats.total,
          questions_correct: existingMastery.questions_correct + stats.correct,
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMastery.id);
    } else {
      // Create new record
      await supabase
        .from("topic_mastery")
        .insert({
          student_id: studentId,
          subject_id: assessment.subject_id,
          topic_id: topic.id,
          mastery_score: topicAccuracy,
          confidence: Math.min(stats.total / 20, 1),
          questions_attempted: stats.total,
          questions_correct: stats.correct,
          last_attempt_at: new Date().toISOString(),
        });
    }
  }
}

async function generateLearningRecommendations(
  assessmentId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient();

  // Get assessment details
  const { data: assessment } = await supabase
    .from("quiz_assessments")
    .select("subject_id, accuracy, subjects(name)")
    .eq("id", assessmentId)
    .single();

  if (!assessment || !assessment.subject_id) {
    return;
  }

  const subjectName = (assessment.subjects as any)?.name || "môn học này";

  // Get weak topics (mastery < 0.6)
  const { data: weakTopics } = await supabase
    .from("topic_mastery")
    .select("*, topics(name)")
    .eq("student_id", studentId)
    .eq("subject_id", assessment.subject_id)
    .lt("mastery_score", 0.6)
    .order("mastery_score", { ascending: true })
    .limit(3);

  if (!weakTopics || weakTopics.length === 0) {
    // No weak topics, add positive recommendation
    if (assessment.accuracy >= 80) {
      await supabase.from("learning_recommendations").insert({
        student_id: studentId,
        action: `Xuất sắc! Tiếp tục duy trì với ${subjectName}`,
        reason: `Bạn đã đạt ${Math.round(assessment.accuracy)}% trong quiz gần nhất. Hãy thử mức độ cao hơn để thử thách bản thân.`,
        evidence: `Quiz accuracy: ${assessment.accuracy}%`,
        confidence: 0.9,
      });
    }
    return;
  }

  // Generate recommendations for weak topics
  for (const topic of weakTopics) {
    const topicName = (topic.topics as any)?.name || "topic này";
    const masteryPercent = Math.round(topic.mastery_score * 100);
    
    let action = "";
    let reason = "";
    let confidence = 0.8;

    if (topic.mastery_score < 0.3) {
      // Very weak - recommend basics
      action = `Ôn lại kiến thức cơ bản về ${topicName}`;
      reason = `Bạn đang gặp khó khăn với ${topicName} (${masteryPercent}% mastery). Hãy xem lại lý thuyết cơ bản và làm các bài tập đơn giản trước.`;
      confidence = 0.95;
    } else if (topic.mastery_score < 0.5) {
      // Weak - recommend practice
      action = `Luyện tập thêm về ${topicName}`;
      reason = `Bạn cần củng cố kiến thức về ${topicName} (${masteryPercent}% mastery). Làm thêm bài tập và quiz tập trung vào phần này.`;
      confidence = 0.85;
    } else {
      // Moderate weak - recommend review
      action = `Ôn tập lại ${topicName}`;
      reason = `Bạn đã nắm được phần lớn về ${topicName} (${masteryPercent}% mastery) nhưng còn một số điểm cần cải thiện. Xem lại các phần sai và làm thêm vài bài tập.`;
      confidence = 0.75;
    }

    await supabase.from("learning_recommendations").insert({
      student_id: studentId,
      action,
      reason,
      evidence: `Topic mastery: ${masteryPercent}%, ${topic.questions_correct}/${topic.questions_attempted} câu đúng`,
      confidence,
    });
  }
}

/**
 * Get quiz questions from database for an assessment
 */
export async function getQuizQuestions(
  assessmentId: string
): Promise<Array<QuizQuestion & { id: string }>> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: questions, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("question_order", { ascending: true });

  if (error || !questions) {
    console.error("Failed to fetch quiz questions:", error);
    return [];
  }

  return questions.map((q: any) => ({
    id: q.id,
    question: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer_index,
    explanation: q.explanation,
    subject: "",
    topic: q.topic || "",
    difficulty: q.difficulty || "basic",
  }));
}

/**
 * Get quiz assessment and questions for client taking page
 */
export async function getQuizAssessmentWithQuestions(assessmentId: string): Promise<{
  success: boolean;
  questions?: Array<QuizQuestion & { id: string }>;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: questions, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("question_order", { ascending: true });

    if (error || !questions || questions.length === 0) {
      return { success: false, error: "Không tìm thấy câu hỏi" };
    }

    return {
      success: true,
      questions: questions.map((q: any) => ({
        id: q.id,
        question: q.question_text,
        options: q.options,
        correctAnswer: q.correct_answer_index,
        explanation: q.explanation,
        subject: "",
        topic: q.topic || "",
        difficulty: q.difficulty || "basic",
      })),
    };
  } catch (error) {
    console.error("Error in getQuizAssessmentWithQuestions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
