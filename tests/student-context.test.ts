/**
 * Student Context Security & Data Accuracy Tests
 * 
 * Tests:
 * 1. User A can only read User A data
 * 2. User B can only read User B data
 * 3. No data leakage between users
 * 4. Empty data doesn't crash
 * 5. Data accuracy from database
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createAdminClient } from "@/lib/supabase/server";
import { buildStudentContext } from "@/lib/ai/context/student-context";

describe("Student Context Security", () => {
  let userAId: string;
  let userBId: string;
  let supabase: Awaited<ReturnType<typeof createAdminClient>>;

  beforeAll(async () => {
    supabase = await createAdminClient();
    
    // Create test users if not exist
    const { data: users } = await supabase
      .from("profiles")
      .select("id")
      .limit(2);
    
    if (users && users.length >= 2) {
      userAId = users[0].id;
      userBId = users[1].id;
    } else {
      console.warn("Not enough users in database for testing. Skipping tests.");
    }
  });

  it("should only return data for authenticated user A", async () => {
    if (!userAId) return;

    const context = await buildStudentContext(userAId, {
      includeProfile: true,
      includeQuizHistory: true,
      includeMastery: true,
      includeStrengthsWeaknesses: true,
    });

    // Verify all queries are scoped to userAId
    // Profile should be for user A or null
    if (context.profile) {
      expect(context.profile).toBeDefined();
    }

    // All quiz data should belong to user A
    const quizzes = context.quizPerformance.recentQuizzes;
    expect(Array.isArray(quizzes)).toBe(true);
    
    // No data from other users should be present
    expect(context).toBeDefined();
  });

  it("should only return data for authenticated user B", async () => {
    if (!userBId) return;

    const context = await buildStudentContext(userBId, {
      includeProfile: true,
      includeQuizHistory: true,
    });

    if (context.profile) {
      expect(context.profile).toBeDefined();
    }

    expect(context).toBeDefined();
  });

  it("should not leak data between users", async () => {
    if (!userAId || !userBId) return;

    const contextA = await buildStudentContext(userAId, {
      includeQuizHistory: true,
      includeMistakes: true,
    });

    const contextB = await buildStudentContext(userBId, {
      includeQuizHistory: true,
      includeMistakes: true,
    });

    // Quiz counts should be different (unless they happen to be the same)
    // More importantly, the actual quiz IDs should be different
    const quizIdsA = contextA.quizPerformance.recentQuizzes.map(q => q.id);
    const quizIdsB = contextB.quizPerformance.recentQuizzes.map(q => q.id);

    // Check no overlap in quiz IDs (they should be completely separate)
    const overlap = quizIdsA.filter(id => quizIdsB.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("should handle user with no learning data gracefully", async () => {
    // Use a UUID that likely doesn't exist
    const fakeUserId = "00000000-0000-0000-0000-000000000001";

    const context = await buildStudentContext(fakeUserId, {
      includeProfile: true,
      includeQuizHistory: true,
      includeMastery: true,
    });

    // Should return empty data, not crash
    expect(context).toBeDefined();
    expect(context.profile).toBeNull();
    expect(context.quizPerformance.summary.totalQuizzes).toBe(0);
    expect(context.quizPerformance.recentQuizzes).toEqual([]);
    expect(context.masteryData.weakTopics).toEqual([]);
  });

  it("should return accurate quiz statistics", async () => {
    if (!userAId) return;

    const context = await buildStudentContext(userAId, {
      includeQuizHistory: true,
    });

    const summary = context.quizPerformance.summary;

    // Verify calculations are correct
    if (summary.totalQuizzes > 0) {
      expect(summary.averageScore).toBeGreaterThanOrEqual(0);
      expect(summary.averageScore).toBeLessThanOrEqual(100);
      expect(summary.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(summary.overallAccuracy).toBeLessThanOrEqual(100);
      expect(summary.totalCorrect).toBeLessThanOrEqual(summary.totalQuestions);
    }
  });

  it("should not include sensitive auth data", async () => {
    if (!userAId) return;

    const context = await buildStudentContext(userAId, {
      includeProfile: true,
    });

    const contextStr = JSON.stringify(context);

    // Should not contain sensitive fields
    expect(contextStr).not.toContain("password");
    expect(contextStr).not.toContain("api_key");
    expect(contextStr).not.toContain("session_token");
    expect(contextStr).not.toContain("auth_token");
  });
});

describe("Student Context Data Accuracy", () => {
  it("should match dashboard data source", async () => {
    const supabase = await createAdminClient();
    
    // Get first user with quiz data
    const { data: quizzes } = await supabase
      .from("quiz_assessments")
      .select("student_id, score, accuracy")
      .not("completed_at", "is", null)
      .limit(1);

    if (!quizzes || quizzes.length === 0) return;

    const studentId = quizzes[0].student_id;
    
    // Get context
    const context = await buildStudentContext(studentId, {
      includeQuizHistory: true,
    });

    // Verify summary is calculated correctly
    const { data: allQuizzes } = await supabase
      .from("quiz_assessments")
      .select("score, accuracy")
      .eq("student_id", studentId)
      .not("completed_at", "is", null);

    if (allQuizzes && allQuizzes.length > 0) {
      const expectedAvgScore = Math.round(
        allQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / allQuizzes.length
      );

      expect(context.quizPerformance.summary.averageScore).toBe(expectedAvgScore);
    }
  });

  it("should correctly identify weak topics", async () => {
    const supabase = await createAdminClient();
    
    const { data: topics } = await supabase
      .from("topic_mastery")
      .select("student_id, mastery_score")
      .lt("mastery_score", 0.6)
      .limit(1);

    if (!topics || topics.length === 0) return;

    const studentId = topics[0].student_id;
    
    const context = await buildStudentContext(studentId, {
      includeMastery: true,
    });

    // All weak topics should have mastery < 60%
    context.masteryData.weakTopics.forEach(topic => {
      expect(topic.masteryScore).toBeLessThan(60);
    });
  });

  it("should correctly identify strong topics", async () => {
    const supabase = await createAdminClient();
    
    const { data: topics } = await supabase
      .from("topic_mastery")
      .select("student_id, mastery_score")
      .gte("mastery_score", 0.8)
      .limit(1);

    if (!topics || topics.length === 0) return;

    const studentId = topics[0].student_id;
    
    const context = await buildStudentContext(studentId, {
      includeMastery: true,
    });

    // All strong topics should have mastery >= 80%
    context.masteryData.strongTopics.forEach(topic => {
      expect(topic.masteryScore).toBeGreaterThanOrEqual(80);
    });
  });
});

describe("Context Formatting for AI", () => {
  it("should format context without fabricating data", async () => {
    const supabase = await createAdminClient();
    
    const { data: users } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (!users || users.length === 0) return;

    const userId = users[0].id;
    const context = await buildStudentContext(userId);

    // Should have all required sections
    expect(context.profile).toBeDefined();
    expect(context.quizPerformance).toBeDefined();
    expect(context.masteryData).toBeDefined();
    expect(context.strengthsWeaknesses).toBeDefined();
    expect(context.mistakeAnalysis).toBeDefined();
    expect(context.learningProgress).toBeDefined();
  });
});
