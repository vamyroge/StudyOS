/**
 * Intent-Based Context Selection
 * Determines what context data to include based on user intent
 */

import type { AIIntent } from "../orchestrator/types";
import type { ContextBuildOptions } from "./student-context";

export interface ContextOptions {
  includeProfile: boolean;
  includeQuizHistory: boolean;
  includeTopics: boolean;
  includeMistakes: boolean;
  includeConversation: boolean;
  quizLimit: number;
  mistakeLimit: number;
}

/**
 * Select appropriate context based on detected intent
 */
export function selectContextByIntent(intent: AIIntent): ContextOptions {
  switch (intent) {
    case "study_plan":
    case "exam_preparation":
      return {
        includeProfile: true,
        includeQuizHistory: true,
        includeTopics: true,
        includeMistakes: true,
        includeConversation: false,
        quizLimit: 5,
        mistakeLimit: 5,
      };

    case "mistake_analysis":
      return {
        includeProfile: true,
        includeQuizHistory: true,
        includeTopics: true,
        includeMistakes: true,
        includeConversation: false,
        quizLimit: 10,
        mistakeLimit: 10,
      };

    case "explanation":
    case "concept_learning":
    case "question_answer":
      return {
        includeProfile: false,
        includeQuizHistory: false,
        includeTopics: true,
        includeMistakes: true,
        includeConversation: true,
        quizLimit: 0,
        mistakeLimit: 3,
      };

    case "quiz_request":
    case "practice_request":
      return {
        includeProfile: true,
        includeQuizHistory: false,
        includeTopics: true,
        includeMistakes: false,
        includeConversation: false,
        quizLimit: 0,
        mistakeLimit: 0,
      };

    case "problem_solving":
    case "homework_help":
      return {
        includeProfile: false,
        includeQuizHistory: false,
        includeTopics: true,
        includeMistakes: true,
        includeConversation: true,
        quizLimit: 0,
        mistakeLimit: 3,
      };

    case "casual_learning":
    case "summary":
    case "unclear":
    default:
      return {
        includeProfile: false,
        includeQuizHistory: false,
        includeTopics: false,
        includeMistakes: false,
        includeConversation: true,
        quizLimit: 0,
        mistakeLimit: 0,
      };
  }
}

/**
 * Determine if heavy learning context is needed
 */
export function needsLearningContext(intent: AIIntent): boolean {
  return [
    "study_plan",
    "exam_preparation",
    "mistake_analysis",
  ].includes(intent);
}

/**
 * Determine if minimal context is sufficient
 */
export function needsMinimalContext(intent: AIIntent): boolean {
  return [
    "casual_learning",
    "unclear",
  ].includes(intent);
}

/**
 * Select comprehensive context options based on intent
 * Maps to new StudentContext builder
 */
export function selectComprehensiveContextByIntent(intent: AIIntent): ContextBuildOptions {
  switch (intent) {
    case "study_plan":
    case "exam_preparation":
      return {
        includeProfile: true,
        includeQuizHistory: true,
        includeMastery: true,
        includeStrengthsWeaknesses: true,
        includeMistakes: true,
        includeProgress: true,
        includeRecommendations: true,
        includeConversations: false,
        quizLimit: 8,
        mistakeLimit: 8,
        activityDays: 30,
      };

    case "mistake_analysis":
      return {
        includeProfile: true,
        includeQuizHistory: true,
        includeMastery: true,
        includeStrengthsWeaknesses: true,
        includeMistakes: true,
        includeProgress: false,
        includeRecommendations: false,
        includeConversations: false,
        quizLimit: 5,
        mistakeLimit: 15,
      };

    case "explanation":
    case "concept_learning":
    case "question_answer":
      return {
        includeProfile: false,
        includeQuizHistory: false,
        includeMastery: true,
        includeStrengthsWeaknesses: false,
        includeMistakes: true,
        includeProgress: false,
        includeRecommendations: false,
        includeConversations: true,
        quizLimit: 0,
        mistakeLimit: 5,
      };

    case "quiz_request":
    case "practice_request":
      return {
        includeProfile: true,
        includeQuizHistory: false,
        includeMastery: true,
        includeStrengthsWeaknesses: true,
        includeMistakes: false,
        includeProgress: false,
        includeRecommendations: false,
        includeConversations: false,
        quizLimit: 0,
        mistakeLimit: 0,
      };

    case "problem_solving":
    case "homework_help":
      return {
        includeProfile: false,
        includeQuizHistory: false,
        includeMastery: true,
        includeStrengthsWeaknesses: false,
        includeMistakes: true,
        includeProgress: false,
        includeRecommendations: false,
        includeConversations: true,
        quizLimit: 0,
        mistakeLimit: 3,
      };

    case "casual_learning":
    case "summary":
    case "unclear":
    default:
      return {
        includeProfile: false,
        includeQuizHistory: false,
        includeMastery: false,
        includeStrengthsWeaknesses: false,
        includeMistakes: false,
        includeProgress: false,
        includeRecommendations: false,
        includeConversations: true,
        quizLimit: 0,
        mistakeLimit: 0,
      };
  }
}
