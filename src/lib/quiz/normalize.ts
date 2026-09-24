/**
 * Quiz Normalization & Validation Module
 *
 * Enforces stable option IDs and canonical correctOptionId resolution
 * to prevent UI freezing, grading race conditions, and shuffle desynchronization.
 */

export interface QuizOption {
  id: string;
  text: string;
}

export interface NormalizedQuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  questions: NormalizedQuizQuestion[];
}

/**
 * Normalizes any raw question input (AI output, DB row, or sessionStorage object)
 * into a canonical NormalizedQuizQuestion with stable option IDs.
 */
export function normalizeQuizQuestion(
  raw: Record<string, unknown> | null | undefined,
  questionIndex = 0
): NormalizedQuizQuestion | null {
  if (!raw || typeof raw !== "object") return null;

  const questionId = String(
    raw.id || raw.quiz_question_id || raw.question_id || `q_${questionIndex}`
  );
  const questionText = String(raw.question || raw.question_text || "").trim();

  if (!questionText) return null;

  // Options normalization
  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  if (rawOptions.length < 2) return null;

  const options: QuizOption[] = rawOptions.map((opt: unknown, optIdx: number) => {
    if (typeof opt === "string") {
      return {
        id: `${questionId}_opt_${optIdx}`,
        text: opt,
      };
    }
    if (opt && typeof opt === "object") {
      const optRecord = opt as Record<string, unknown>;
      return {
        id: String(optRecord.id || `${questionId}_opt_${optIdx}`),
        text: String(optRecord.text ?? optRecord.content ?? optRecord.label ?? optRecord.option ?? ""),
      };
    }
    return {
      id: `${questionId}_opt_${optIdx}`,
      text: String(opt ?? ""),
    };
  });

  // Resolve correctOptionId
  let resolvedCorrectOptionId: string | null = null;

  // 1. If correctOptionId is explicitly given and exists in options
  if (raw.correctOptionId && options.some((o) => o.id === String(raw.correctOptionId))) {
    resolvedCorrectOptionId = String(raw.correctOptionId);
  }

  // 2. If correctAnswer or correct_answer_index is a number
  const candidateIndex =
    typeof raw.correctAnswer === "number"
      ? raw.correctAnswer
      : typeof raw.correct_answer_index === "number"
      ? raw.correct_answer_index
      : typeof raw.correct_answer === "number"
      ? raw.correct_answer
      : null;

  if (candidateIndex !== null && options[candidateIndex]) {
    resolvedCorrectOptionId = options[candidateIndex].id;
  }

  // 3. If correct answer is a string index ("0", "1", "2", "3")
  if (!resolvedCorrectOptionId) {
    const rawVal = String(raw.correctAnswer ?? raw.correct_answer_index ?? raw.correct_answer ?? "").trim();
    if (/^[0-9]+$/.test(rawVal)) {
      const idx = parseInt(rawVal, 10);
      if (options[idx]) {
        resolvedCorrectOptionId = options[idx].id;
      }
    } else if (/^[A-Da-d]$/.test(rawVal)) {
      // 4. Letter-based ("A", "B", "C", "D")
      const letterIdx = "abcd".indexOf(rawVal.toLowerCase());
      if (letterIdx >= 0 && options[letterIdx]) {
        resolvedCorrectOptionId = options[letterIdx].id;
      }
    } else if (rawVal) {
      // 5. Match by option ID or option text
      const matchById = options.find((o) => o.id === rawVal);
      if (matchById) {
        resolvedCorrectOptionId = matchById.id;
      } else {
        const matchByText = options.find(
          (o) => o.text.trim().toLowerCase() === rawVal.toLowerCase()
        );
        if (matchByText) {
          resolvedCorrectOptionId = matchByText.id;
        }
      }
    }
  }

  // Validate that correctOptionId actually exists within options
  if (!resolvedCorrectOptionId || !options.some((o) => o.id === resolvedCorrectOptionId)) {
    return null;
  }

  return {
    id: questionId,
    question: questionText,
    options,
    correctOptionId: resolvedCorrectOptionId,
    explanation: String(raw.explanation || ""),
    subject: raw.subject ? String(raw.subject) : "",
    topic: String(raw.topic || ""),
    difficulty: String(raw.difficulty || "basic"),
  };
}

/**
 * Validates an array of questions, ensuring all questions have valid options
 * and a guaranteed matching correctOptionId.
 */
export function validateQuizQuestions(rawQuestions: unknown[]): ValidationResult {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return {
      valid: false,
      error: "Không có câu hỏi nào trong danh sách.",
      questions: [],
    };
  }

  const normalizedList: NormalizedQuizQuestion[] = [];

  for (let i = 0; i < rawQuestions.length; i++) {
    const item = rawQuestions[i];
    const normalized = normalizeQuizQuestion(
      item && typeof item === "object" ? (item as Record<string, unknown>) : null,
      i
    );
    if (!normalized) {
      return {
        valid: false,
        error: `Câu hỏi số ${i + 1} không hợp lệ hoặc thiếu đáp án đúng.`,
        questions: [],
      };
    }
    normalizedList.push(normalized);
  }

  return {
    valid: true,
    questions: normalizedList,
  };
}

export interface RawQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
}

/**
 * Validates semantic correctness of parsed quiz questions.
 * Ensures each question has 4 valid options, a valid correctAnswer, and no empty fields.
 */
export function validateQuizSemantics(data: unknown): {
  valid: boolean;
  questions?: RawQuizQuestion[];
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Dữ liệu quiz không phải là object" };
  }

  const rawQuestions = (data as Record<string, unknown>).questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { valid: false, error: "Danh sách câu hỏi trống hoặc không hợp lệ" };
  }

  const validatedQuestions: RawQuizQuestion[] = [];

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i] as Record<string, unknown> | null;
    if (!q || typeof q !== "object") {
      return { valid: false, error: `Câu hỏi số ${i + 1} không hợp lệ` };
    }

    const questionText = String(q.question || q.question_text || "").trim();
    if (!questionText) {
      return { valid: false, error: `Câu hỏi số ${i + 1} thiếu nội dung câu hỏi` };
    }

    const rawOptions = Array.isArray(q.options) ? q.options : [];
    if (rawOptions.length !== 4) {
      return { valid: false, error: `Câu hỏi số ${i + 1} không có đúng 4 đáp án` };
    }

    const options: string[] = rawOptions.map((opt: unknown) => {
      if (typeof opt === "string") return opt.trim();
      if (opt && typeof opt === "object") {
        const o = opt as Record<string, unknown>;
        return String(o.text ?? o.label ?? o.content ?? "").trim();
      }
      return String(opt ?? "").trim();
    });

    if (options.some((opt) => !opt)) {
      return { valid: false, error: `Câu hỏi số ${i + 1} có đáp án rỗng` };
    }

    let correctAnswerIdx = -1;
    if (typeof q.correctAnswer === "number") {
      correctAnswerIdx = q.correctAnswer;
    } else if (typeof q.correct_answer_index === "number") {
      correctAnswerIdx = q.correct_answer_index;
    } else if (typeof q.correctAnswer === "string") {
      const parsed = parseInt(q.correctAnswer, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
        correctAnswerIdx = parsed;
      } else if (/^[A-D]$/i.test(q.correctAnswer.trim())) {
        correctAnswerIdx = "abcd".indexOf(q.correctAnswer.trim().toLowerCase());
      }
    }

    if (correctAnswerIdx < 0 || correctAnswerIdx > 3 || !options[correctAnswerIdx]) {
      return { valid: false, error: `Câu hỏi số ${i + 1} có chỉ số đáp án đúng không hợp lệ` };
    }

    validatedQuestions.push({
      question: questionText,
      options,
      correctAnswer: correctAnswerIdx,
      explanation: String(q.explanation || ""),
      subject: String(q.subject || ""),
      topic: String(q.topic || ""),
      difficulty: String(q.difficulty || "basic"),
    });
  }

  return { valid: true, questions: validatedQuestions };
}

/**
 * Shuffles options of a question without breaking correctOptionId reference.
 * Canonical source of truth remains option.id.
 */
export function shuffleQuestionOptions(
  question: NormalizedQuizQuestion,
  randomFn = Math.random
): NormalizedQuizQuestion {
  const shuffledOptions = [...question.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = shuffledOptions[i];
    shuffledOptions[i] = shuffledOptions[j];
    shuffledOptions[j] = temp;
  }

  return {
    ...question,
    options: shuffledOptions,
  };
}
