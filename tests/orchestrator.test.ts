import { describe, it, expect } from "vitest";
import { detectIntent } from "@/lib/ai/orchestrator/intent";
import { routeRole } from "@/lib/ai/orchestrator/role-router";

describe("detectIntent", () => {
  it("detects explanation intent", () => {
    expect(detectIntent("Giải thích khái niệm hàm số bậc nhất")).toBe("explanation");
  });

  it("detects problem_solving intent", () => {
    expect(detectIntent("Giải bài tập này giúp mình")).toBe("homework_help");
  });

  it("detects quiz_request intent with explicit keywords", () => {
    expect(detectIntent("Cho mình quiz về phương trình")).toBe("quiz_request");
    expect(detectIntent("Tạo câu hỏi trắc nghiệm")).toBe("quiz_request");
  });

  it("detects practice_request intent", () => {
    expect(detectIntent("Cho mình bài tập luyện tập")).toBe("practice_request");
  });

  it("detects summary intent", () => {
    expect(detectIntent("Tóm tắt chương 1")).toBe("summary");
  });

  it("detects study_plan intent", () => {
    expect(detectIntent("Lập kế hoạch học tập môn toán")).toBe("study_plan");
  });

  it("detects mistake_analysis intent", () => {
    expect(detectIntent("Tại sao tôi sai câu này")).toBe("mistake_analysis");
  });

  it("detects casual_learning for greetings", () => {
    expect(detectIntent("Xin chào")).toBe("casual_learning");
    expect(detectIntent("Hello")).toBe("casual_learning");
  });

  it("defaults to unclear for unmatched text", () => {
    expect(detectIntent("asdfghjkl random text")).toBe("unclear");
  });

  it("does NOT automatically create quiz for simple questions", () => {
    expect(detectIntent("Định luật Boyle là gì?")).not.toBe("quiz_request");
    expect(detectIntent("Công thức tính diện tích hình tròn")).not.toBe("quiz_request");
  });
});

describe("routeRole", () => {
  it("routes explanation to tutor", () => {
    expect(routeRole("explanation")).toBe("tutor");
  });

  it("routes problem_solving to problem_solver", () => {
    expect(routeRole("problem_solving")).toBe("problem_solver");
  });

  it("routes quiz_request to examiner", () => {
    expect(routeRole("quiz_request")).toBe("examiner");
  });

  it("routes summary to reviewer", () => {
    expect(routeRole("summary")).toBe("reviewer");
  });

  it("routes study_plan to coach", () => {
    expect(routeRole("study_plan")).toBe("coach");
  });

  it("defaults to tutor for unclear", () => {
    expect(routeRole("unclear")).toBe("tutor");
  });
});
