// Intent types for AI Tutor conversations
export type Intent =
  | "question_answer"
  | "explanation"
  | "problem_solving"
  | "concept_learning"
  | "summary"
  | "quiz_request"        // ONLY when explicitly requested
  | "practice_request"
  | "homework_help"
  | "exam_preparation"
  | "mistake_analysis"
  | "study_plan"
  | "casual_learning"
  | "unclear";

/**
 * Detects user intent from message
 * IMPORTANT: Does NOT automatically infer quiz intent unless explicitly requested
 */
export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase().trim();

  // EXPLICIT quiz/practice requests ONLY
  const quizKeywords = [
    /(?:tạo|cho|đưa|ra)\s+(?:câu hỏi|quiz|bài (?:trắc nghiệm|kiểm tra))/,
    /(?:kiểm tra|test)\s+(?:tôi|mình|em)/,
    /(?:làm|muốn)\s+(?:quiz|trắc nghiệm|bài test)/,
    /cho\s+(?:tôi|mình|em)\s+(?:luyện\s+tập|quiz)/,
    /quiz\s+về/,
  ];

  for (const pattern of quizKeywords) {
    if (pattern.test(lower)) {
      return "quiz_request";
    }
  }

  // Practice/exercise requests
  if (
    /(?:luyện tập|bài tập|practice|exercise)/.test(lower) &&
    /(?:cho|đưa|gửi|cung cấp)/.test(lower)
  ) {
    return "practice_request";
  }

  // Homework help
  if (
    /(?:giải|làm)\s+(?:bài|bài tập|homework)/.test(lower) ||
    /(?:hướng dẫn|chỉ|giúp)\s+(?:giải|làm)/.test(lower)
  ) {
    return "homework_help";
  }

  // Mistake analysis - check BEFORE explanation to prioritize
  if (
    /(?:tại sao|why|vì sao)/.test(lower) &&
    /(?:sai|lỗi|mistake|error|nhầm)/.test(lower)
  ) {
    return "mistake_analysis";
  }

  // Explanation requests
  if (
    /(?:giải thích|explain|tại sao|why|vì sao)/.test(lower) ||
    /(?:là gì|what is|nghĩa là)/.test(lower)
  ) {
    return "explanation";
  }

  // Summary requests
  if (
    /(?:tóm tắt|summary|summarize|tổng hợp)/.test(lower)
  ) {
    return "summary";
  }

  // Exam preparation
  if (
    /(?:ôn tập|ôn thi|prepare|exam|kỳ thi)/.test(lower)
  ) {
    return "exam_preparation";
  }

  // Study plan
  if (
    /(?:kế hoạch|lộ trình|plan|study plan)/.test(lower)
  ) {
    return "study_plan";
  }

  // Concept learning (educational questions)
  if (
    /(?:định luật|công thức|khái niệm|concept|law|formula)/.test(lower) ||
    /(?:cách|how to|làm sao)/.test(lower)
  ) {
    return "concept_learning";
  }

  // Problem solving (math/physics problems)
  if (
    /(?:tính|calculate|giải|solve|tìm|find)/.test(lower) &&
    /(?:\d+|phương trình|equation|bài toán|problem)/.test(lower)
  ) {
    return "problem_solving";
  }

  // Simple question-answer
  if (
    /(?:\?|hỏi|question|câu hỏi)/.test(lower) ||
    lower.endsWith('?')
  ) {
    return "question_answer";
  }

  // Casual learning (greetings, general chat)
  if (
    /(?:xin chào|hello|hi|chào|cảm ơn|thank)/.test(lower) ||
    lower.length < 20
  ) {
    return "casual_learning";
  }

  return "unclear";
}

/**
 * Determines if the intent should trigger a quiz/structured response
 */
export function shouldGenerateQuiz(intent: Intent): boolean {
  return intent === "quiz_request" || intent === "practice_request";
}

/**
 * Get response mode based on intent
 */
export function getResponseMode(intent: Intent): 'plain_text' | 'explanation' | 'solution' | 'quiz' | 'code' {
  if (intent === "quiz_request" || intent === "practice_request") {
    return "quiz";
  }
  
  if (intent === "problem_solving" || intent === "homework_help") {
    return "solution";
  }

  if (intent === "explanation" || intent === "concept_learning") {
    return "explanation";
  }

  return "plain_text";
}
