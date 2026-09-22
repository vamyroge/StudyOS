import { describe, it, expect } from "vitest";
import { detectIntent } from "@/lib/ai/orchestrator/intent";
import { routeRole } from "@/lib/ai/orchestrator/role-router";

describe("detectIntent", () => {
  it("detects explain_concept intent", () => {
    expect(detectIntent("Giải thích khái niệm hàm số bậc nhất")).toBe("explain_concept");
  });

  it("detects solve_problem intent", () => {
    expect(detectIntent("Giải bài tập này giúp mình")).toBe("solve_problem");
  });

  it("detects practice intent", () => {
    expect(detectIntent("Cho mình thêm bài luyện tập")).toBe("practice");
  });

  it("detects review intent", () => {
    expect(detectIntent("Xem lại tổng kết chương 1")).toBe("review");
  });

  it("detects diagnose intent", () => {
    expect(detectIntent("Phân tích lỗi sai của mình")).toBe("diagnose");
  });

  it("detects plan intent", () => {
    expect(detectIntent("Lập kế hoạch học tập môn toán")).toBe("plan");
  });

  it("detects analyze_error intent", () => {
    expect(detectIntent("mistake wrong tại sao lỗi")).toBe("analyze_error");
  });

  it("defaults to general_question for unmatched text", () => {
    expect(detectIntent("Hello there")).toBe("general_question");
  });
});

describe("routeRole", () => {
  it("routes explain_concept to tutor", () => {
    expect(routeRole("explain_concept")).toBe("tutor");
  });

  it("routes solve_problem to problem_solver", () => {
    expect(routeRole("solve_problem")).toBe("problem_solver");
  });

  it("routes practice to examiner", () => {
    expect(routeRole("practice")).toBe("examiner");
  });

  it("routes review to reviewer", () => {
    expect(routeRole("review")).toBe("reviewer");
  });

  it("routes plan to coach", () => {
    expect(routeRole("plan")).toBe("coach");
  });

  it("defaults to tutor for unknown", () => {
    expect(routeRole("unknown")).toBe("tutor");
  });
});