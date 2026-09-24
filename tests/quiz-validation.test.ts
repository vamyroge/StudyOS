import { describe, it, expect } from "vitest";
import { validateQuizSemantics } from "@/lib/quiz/normalize";

describe("Quiz Semantic Validation (Task Spec #14)", () => {
  it("validates well-formed quiz data", () => {
    const validData = {
      questions: [
        {
          question: "Phương trình x² - 4 = 0 có bao nhiêu nghiệm?",
          options: ["0", "1", "2", "Vô số"],
          correctAnswer: 2,
          explanation: "Phương trình có 2 nghiệm x = 2 và x = -2",
          subject: "Toán",
          topic: "Phương trình bậc hai",
          difficulty: "basic",
        },
      ],
    };

    const result = validateQuizSemantics(validData);
    expect(result.valid).toBe(true);
    expect(result.questions).toHaveLength(1);
    expect(result.questions![0].correctAnswer).toBe(2);
  });

  it("handles letter-based correctAnswer (A, B, C, D)", () => {
    const dataWithLetters = {
      questions: [
        {
          question: "Định luật I Newton còn gọi là gì?",
          options: ["Quán tính", "Tác dụng", "Hấp dẫn", "Động lượng"],
          correctAnswer: "A",
          explanation: "Định luật quán tính",
        },
      ],
    };

    const result = validateQuizSemantics(dataWithLetters);
    expect(result.valid).toBe(true);
    expect(result.questions![0].correctAnswer).toBe(0);
  });

  it("rejects quiz when question has fewer or more than 4 options", () => {
    const invalidOptions = {
      questions: [
        {
          question: "Câu hỏi 3 đáp án",
          options: ["A", "B", "C"],
          correctAnswer: 0,
        },
      ],
    };

    const result = validateQuizSemantics(invalidOptions);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("không có đúng 4 đáp án");
  });

  it("rejects quiz when correctAnswer index is out of bounds", () => {
    const invalidAnswerIdx = {
      questions: [
        {
          question: "Câu hỏi có đáp án ngoài phạm vi",
          options: ["A", "B", "C", "D"],
          correctAnswer: 4, // 0..3 only
        },
      ],
    };

    const result = validateQuizSemantics(invalidAnswerIdx);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("chỉ số đáp án đúng không hợp lệ");
  });

  it("rejects quiz with empty options", () => {
    const emptyOption = {
      questions: [
        {
          question: "Câu hỏi có đáp án rỗng",
          options: ["A", "B", "", "D"],
          correctAnswer: 0,
        },
      ],
    };

    const result = validateQuizSemantics(emptyOption);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("có đáp án rỗng");
  });

  it("rejects quiz with empty question list", () => {
    const emptyList = { questions: [] };
    const result = validateQuizSemantics(emptyList);
    expect(result.valid).toBe(false);
  });
});
