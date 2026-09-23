"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
}

interface QuizAnswer {
  question: number;
  answer: number;
  correct: boolean;
}

interface QuizReviewProps {
  assessmentId: string;
}

export function QuizReview({ assessmentId }: QuizReviewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const stored = sessionStorage.getItem(`quiz_result_${assessmentId}`);
    if (stored) {
      try {
        const { questions: q, answers: a } = JSON.parse(stored);
        setQuestions(q || []);
        setAnswers(a || []);
        // Auto-expand wrong answers
        const wrongAnswers = new Set<number>(
          (a || []).map((ans: QuizAnswer, idx: number) => (!ans.correct ? idx : -1)).filter((idx: number) => idx !== -1)
        );
        setExpandedQuestions(wrongAnswers);
      } catch (e) {
        console.error("Failed to parse quiz results:", e);
      }
    }
  }, [assessmentId]);

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set<number>(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (questions.length === 0 || answers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết từng câu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => {
          const answer = answers[index];
          if (!answer) return null;

          const isExpanded = expandedQuestions.has(index);
          const isCorrect = answer.correct;

          return (
            <div
              key={index}
              className={`rounded-lg border-2 p-4 ${
                isCorrect
                  ? "border-green-200 bg-green-50 dark:bg-green-950"
                  : "border-red-200 bg-red-50 dark:bg-red-950"
              }`}
            >
              <div
                className="flex items-start justify-between gap-2 cursor-pointer"
                onClick={() => toggleQuestion(index)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">Câu {index + 1}</span>
                      <Badge variant="secondary" className="text-xs">
                        {question.topic}
                      </Badge>
                      <Badge
                        variant={isCorrect ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {isCorrect ? "Đúng" : "Sai"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{question.question}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4 pl-9 space-y-3">
                  {/* Options */}
                  <div className="space-y-2">
                    {question.options.map((option, optIdx) => {
                      const isUserAnswer = optIdx === answer.answer;
                      const isCorrectAnswer = optIdx === question.correctAnswer;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrectAnswer
                              ? "border-green-500 bg-green-100 dark:bg-green-900/20"
                              : isUserAnswer
                              ? "border-red-500 bg-red-100 dark:bg-red-900/20"
                              : "border-gray-200 bg-white dark:bg-gray-900"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-sm">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="text-sm flex-1">{option}</span>
                            {isCorrectAnswer && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
                    <p className="text-sm font-medium mb-1">💡 Giải thích:</p>
                    <p className="text-sm text-muted-foreground">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
