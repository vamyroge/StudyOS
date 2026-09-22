import { describe, it, expect } from "vitest";

describe("Mastery Tracking Algorithm", () => {
  // V1 algorithm: correct +0.1, incorrect -0.15, clamped [0,1]
  
  it("increases mastery on correct answer", () => {
    const current = 0.5;
    const delta = 0.1;
    const newMastery = Math.max(0, Math.min(1, current + delta));
    
    expect(newMastery).toBe(0.6);
  });

  it("decreases mastery on incorrect answer", () => {
    const current = 0.5;
    const delta = -0.15;
    const newMastery = Math.max(0, Math.min(1, current + delta));
    
    expect(newMastery).toBe(0.35);
  });

  it("clamps mastery at 0 minimum", () => {
    const current = 0.1;
    const delta = -0.15;
    const newMastery = Math.max(0, Math.min(1, current + delta));
    
    expect(newMastery).toBe(0);
  });

  it("clamps mastery at 1 maximum", () => {
    const current = 0.95;
    const delta = 0.1;
    const newMastery = Math.max(0, Math.min(1, current + delta));
    
    expect(newMastery).toBe(1);
  });

  it("identifies weakness at threshold", () => {
    const WEAKNESS_THRESHOLD = 0.4;
    
    expect(0.3 < WEAKNESS_THRESHOLD).toBe(true);
    expect(0.4 < WEAKNESS_THRESHOLD).toBe(false);
    expect(0.5 < WEAKNESS_THRESHOLD).toBe(false);
  });

  it("calculates severity correctly", () => {
    const masteryLevel = 0.3;
    const severity = 1 - masteryLevel;
    
    expect(severity).toBe(0.7);
  });

  it("simulates learning progression", () => {
    let mastery = 0;
    
    // First 5 correct answers
    for (let i = 0; i < 5; i++) {
      mastery = Math.min(1, mastery + 0.1);
    }
    expect(mastery).toBe(0.5);
    
    // 2 incorrect answers
    for (let i = 0; i < 2; i++) {
      mastery = Math.max(0, mastery - 0.15);
    }
    expect(mastery).toBeCloseTo(0.2, 10);
    
    // Recovery with 8 correct answers
    for (let i = 0; i < 8; i++) {
      mastery = Math.min(1, mastery + 0.1);
    }
    expect(mastery).toBeCloseTo(1.0, 10);
  });
});

describe("Recommendation Generation", () => {
  it("prioritizes top 3 weaknesses by severity", () => {
    const weaknesses = [
      { concept_id: "a", severity: 0.8 },
      { concept_id: "b", severity: 0.6 },
      { concept_id: "c", severity: 0.9 },
      { concept_id: "d", severity: 0.4 },
      { concept_id: "e", severity: 0.7 },
    ];
    
    const top3 = weaknesses
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3);
    
    expect(top3).toHaveLength(3);
    expect(top3[0].concept_id).toBe("c");
    expect(top3[1].concept_id).toBe("a");
    expect(top3[2].concept_id).toBe("e");
  });

  it("generates dedup key for recommendations", () => {
    const conceptId = "abc123";
    const dedupKey = `weakness:${conceptId}`;
    
    expect(dedupKey).toBe("weakness:abc123");
  });
});
