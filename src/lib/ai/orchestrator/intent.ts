import type { AIIntent } from "./types";

const INTENT_KEYWORDS: Record<AIIntent, string[]> = {
  explain_concept: ["giải thích", "là gì", "khái niệm", "định nghĩa", "hiểu", "learn"],
  solve_problem: ["giải", "bài tập", "làm sao", "cách tính", "solve", "tính"],
  practice: ["luyện tập", "thêm bài", "practice", "ôn tập", "drill"],
  review: ["xem lại", "tổng kết", "review", "ôn lại"],
  diagnose: ["điểm yếu", "chưa hiểu", "sai", "diagnose", "phân tích lỗi"],
  plan: ["kế hoạch", "lộ trình", "plan", "nên học gì", "schedule"],
  analyze_error: ["tại sao sai", "lỗi", "phân tích", "mistake", "wrong"],
  general_question: [],
  unknown: [],
};

export function detectIntent(message: string): AIIntent {
  const lower = message.toLowerCase();

  let bestMatch: AIIntent = "general_question";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === "general_question" || intent === "unknown") continue;
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent as AIIntent;
    }
  }

  return bestMatch;
}
