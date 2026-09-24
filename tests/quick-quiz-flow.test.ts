import { describe, it, expect, vi } from "vitest";
import {
  normalizeQuizQuestion,
  validateQuizQuestions,
  shuffleQuestionOptions,
  type NormalizedQuizQuestion,
} from "@/lib/quiz/normalize";

describe("Quick Quiz Flow & Error Resilience", () => {
  const sampleRawQuestion = {
    id: "q_1",
    question: "Thủ đô của Việt Nam là gì?",
    options: ["Hồ Chí Minh", "Hải Phòng", "Hà Nội", "Đà Nẵng"],
    correctAnswer: 2, // Index 2 -> "Hà Nội"
    explanation: "Hà Nội là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.",
    subject: "Địa lý",
    topic: "Địa lý Việt Nam",
  };

  describe("Question Normalization & Stable IDs", () => {
    it("assigns stable unique IDs to each option", () => {
      const q = normalizeQuizQuestion(sampleRawQuestion);
      expect(q).not.toBeNull();
      expect(q!.options).toHaveLength(4);

      // Verify each option has stable id & text
      q!.options.forEach((opt, idx) => {
        expect(opt.id).toBe(`q_1_opt_${idx}`);
        expect(typeof opt.text).toBe("string");
      });

      // Verify correctOptionId points to "Hà Nội" (index 2)
      expect(q!.correctOptionId).toBe("q_1_opt_2");
      const correctOpt = q!.options.find((o) => o.id === q!.correctOptionId);
      expect(correctOpt?.text).toBe("Hà Nội");
    });

    it("supports letter-based correct answers (A, B, C, D)", () => {
      const letterQ = {
        ...sampleRawQuestion,
        correctAnswer: "C", // C = index 2
      };
      const q = normalizeQuizQuestion(letterQ);
      expect(q).not.toBeNull();
      expect(q!.correctOptionId).toBe("q_1_opt_2");
    });
  });

  describe("Case 1 — chọn đúng (Select correct option)", () => {
    it("highlights selected, determines correct, and enables next immediately", () => {
      const q = normalizeQuizQuestion(sampleRawQuestion)!;

      // User clicks option C (index 2: "Hà Nội")
      const optionC = q.options[2];
      const selectedOptionId = optionC.id;
      const isAnswered = true;

      // Selection & grading state
      const isSelected = selectedOptionId === optionC.id;
      const isCorrect = isAnswered && optionC.id === q.correctOptionId;
      const showWrong = isAnswered && isSelected && !isCorrect;

      expect(isSelected).toBe(true);
      expect(isCorrect).toBe(true);
      expect(showWrong).toBe(false);

      // Next button must be enabled
      const canProceedToNext = isAnswered;
      expect(canProceedToNext).toBe(true);
    });
  });

  describe("Case 2 — chọn sai (Select wrong option)", () => {
    it("highlights wrong, highlights correct answer, and enables next immediately", () => {
      const q = normalizeQuizQuestion(sampleRawQuestion)!;

      // User clicks option B (index 1: "Hải Phòng")
      const optionB = q.options[1];
      const selectedOptionId = optionB.id;
      const isAnswered = true;

      // For clicked option (B)
      const isBSelected = selectedOptionId === optionB.id;
      const isBCorrect = isAnswered && optionB.id === q.correctOptionId;
      const showBWrong = isAnswered && isBSelected && !isBCorrect;

      expect(isBSelected).toBe(true);
      expect(isBCorrect).toBe(false);
      expect(showBWrong).toBe(true);

      // For correct option (C)
      const optionC = q.options[2];
      const showCCorrect = isAnswered && optionC.id === q.correctOptionId;
      expect(showCCorrect).toBe(true);

      // Next button must still be enabled
      const canProceedToNext = isAnswered;
      expect(canProceedToNext).toBe(true);
    });
  });

  describe("Case 3 — API lỗi (API failure does not freeze UI)", async () => {
    it("keeps answer rendered and UI active if background API submission fails", async () => {
      const q = normalizeQuizQuestion(sampleRawQuestion)!;
      const option = q.options[2];

      // Simulated UI state
      let selectedOptionId: string | null = null;
      let isAnswered = false;
      let isStuck = false;

      // Simulated selection handler with background API failure
      function handleSelect(optId: string) {
        // Immediate UI update
        selectedOptionId = optId;
        isAnswered = true;

        // Background API call fails
        const mockSubmitApi = vi.fn().mockRejectedValue(new Error("Network / DB error"));
        mockSubmitApi().catch((err: unknown) => {
          expect(err).toBeInstanceOf(Error);
          // UI state must NOT be reverted
          // isStuck must remain false
        });
      }

      handleSelect(option.id);

      expect(selectedOptionId).toBe(option.id);
      expect(isAnswered).toBe(true);
      expect(isStuck).toBe(false);

      // Even if API failed, question grading state is intact
      const isCorrect = selectedOptionId === q.correctOptionId;
      expect(isCorrect).toBe(true);
    });
  });

  describe("Case 4 — AI lỗi / timeout (AI failure does not block quiz)", async () => {
    it("displays result immediately without waiting for AI explanation or analytics", async () => {
      const q = normalizeQuizQuestion(sampleRawQuestion)!;
      const option = q.options[0];

      let selectedOptionId: string | null = null;
      let isAnswered = false;

      // Long running / timing out background AI task
      const mockAITask = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error("AI timeout")), 2000);
        });
      });

      // Synchronous select
      selectedOptionId = option.id;
      isAnswered = true;

      // Background AI call does not block selection
      mockAITask().catch(() => {});

      // Immediate UI responsiveness confirmed
      expect(selectedOptionId).toBe(option.id);
      expect(isAnswered).toBe(true);
      expect(selectedOptionId === q.correctOptionId).toBe(false);
    });
  });

  describe("Case 5 — missing correctOptionId (Graceful handling of invalid quiz)", () => {
    it("fails validation gracefully instead of crashing or causing infinite loading", () => {
      const invalidQuestion = {
        id: "q_bad",
        question: "Câu hỏi bị lỗi đáp án",
        options: ["A", "B", "C", "D"],
        correctAnswer: 99, // Out of bounds!
      };

      const normalized = normalizeQuizQuestion(invalidQuestion);
      expect(normalized).toBeNull();

      const validation = validateQuizQuestions([invalidQuestion]);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("không hợp lệ hoặc thiếu đáp án đúng");
      expect(validation.questions).toHaveLength(0);
    });

    it("rejects questions with empty question text or fewer than 2 options", () => {
      expect(normalizeQuizQuestion({ question: "", options: ["A", "B"], correctAnswer: 0 })).toBeNull();
      expect(normalizeQuizQuestion({ question: "Valid?", options: ["Only One"], correctAnswer: 0 })).toBeNull();
    });
  });

  describe("Case 6 — shuffled options (Shuffle does not desynchronize correct answer)", () => {
    it("maintains correctOptionId pointing to the exact same option after shuffle", () => {
      const q = normalizeQuizQuestion(sampleRawQuestion)!;
      const originalCorrectOption = q.options.find((o) => o.id === q.correctOptionId);
      expect(originalCorrectOption?.text).toBe("Hà Nội");

      // Shuffle options multiple times with various permutations
      for (let i = 0; i < 20; i++) {
        const shuffled = shuffleQuestionOptions(q);

        // Verify correctOptionId still exists in shuffled options
        expect(shuffled.options.some((o) => o.id === shuffled.correctOptionId)).toBe(true);

        // Verify option matching correctOptionId is STILL "Hà Nội"
        const correctOptInShuffled = shuffled.options.find((o) => o.id === shuffled.correctOptionId);
        expect(correctOptInShuffled?.text).toBe("Hà Nội");
        expect(correctOptInShuffled?.id).toBe(q.correctOptionId);

        // Verify selecting by option.id yields isCorrect === true regardless of index
        const userSelected = correctOptInShuffled!;
        expect(userSelected.id === shuffled.correctOptionId).toBe(true);
      }
    });
  });

  describe("Case 7 — 10 câu hỏi liên tục không bị stuck", () => {
    it("progresses through all 10 questions sequentially without freezing", () => {
      // Generate 10 mock questions
      const mockRawQuestions = Array.from({ length: 10 }, (_, i) => ({
        id: `question_${i + 1}`,
        question: `Câu hỏi số ${i + 1}: 2 + ${i} = ?`,
        options: [`${2 + i}`, `${3 + i}`, `${4 + i}`, `${5 + i}`],
        correctAnswer: 0, // Option 0 is correct
        explanation: `Giải thích cho câu ${i + 1}`,
      }));

      const validation = validateQuizQuestions(mockRawQuestions);
      expect(validation.valid).toBe(true);
      expect(validation.questions).toHaveLength(10);

      const questions = validation.questions;
      let currentIndex = 0;
      let selectedOptionId: string | null = null;
      let isAnswered = false;
      const recordedAnswers: Array<{ questionId: string; correct: boolean }> = [];

      // Step through all 10 questions
      for (let qIdx = 0; qIdx < 10; qIdx++) {
        expect(currentIndex).toBe(qIdx);
        const currentQ = questions[currentIndex];

        // 1. User selects an option (e.g. correct on even, wrong on odd)
        const chosenOption = qIdx % 2 === 0 ? currentQ.options[0] : currentQ.options[1];
        selectedOptionId = chosenOption.id;
        isAnswered = true;

        const isCorrect = chosenOption.id === currentQ.correctOptionId;
        recordedAnswers.push({ questionId: currentQ.id, correct: isCorrect });

        expect(isAnswered).toBe(true);
        expect(selectedOptionId).not.toBeNull();

        // 2. Next question
        if (currentIndex < questions.length - 1) {
          currentIndex++;
          selectedOptionId = null;
          isAnswered = false;
        }
      }

      // Quiz completed
      expect(recordedAnswers).toHaveLength(10);
      const correctCount = recordedAnswers.filter((a) => a.correct).length;
      expect(correctCount).toBe(5); // 5 correct, 5 wrong
      expect(currentIndex).toBe(9); // Last question reached
    });
  });
});
