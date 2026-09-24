"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizAnswerData {
  question_id: string;
  question_text: string;
  options: string[];
  selected_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
  topic: string;
  subject: string;
  difficulty: string;
}

interface QuizReviewProps {
  assessmentId: string;
}

export function QuizReview({ assessmentId }: QuizReviewProps) {
  const [answers, setAnswers] = useState<QuizAnswerData[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Markdown renderer for math formulas
  const MarkdownRenderer = ({ content }: { content: string }) => (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
          code: ({ inline, children }: any) => inline ? 
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code> :
            <pre className="overflow-x-auto bg-muted p-3 rounded-md mb-2"><code>{children}</code></pre>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border-collapse border border-border">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border px-2 py-1 bg-muted font-semibold text-left text-xs">{children}</th>,
          td: ({ children }) => <td className="border border-border px-2 py-1 text-xs">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  useEffect(() => {
    const fetchQuizAnswers = async () => {
      try {
        const supabase = await createClient();
        
        // Fetch answers with quiz_questions (new schema)
        const { data: quizAnswers, error } = await supabase
          .from("quiz_answers")
          .select(`
            *,
            quiz_questions(
              id,
              question_text,
              options,
              correct_answer_index,
              explanation,
              topic
            )
          `)
          .eq("assessment_id", assessmentId);

        if (error) {
          console.error("Failed to fetch quiz answers:", error);
          setLoading(false);
          return;
        }

        const formattedAnswers = quizAnswers?.map((qa: any) => ({
          question_id: qa.quiz_question_id || qa.question_id,
          question_text: qa.quiz_questions?.question_text || qa.questions?.question_text || "Câu hỏi",
          options: qa.quiz_questions?.options || qa.questions?.options || [],
          selected_answer: qa.selected_answer_index ?? parseInt(qa.selected_answer),
          correct_answer: qa.quiz_questions?.correct_answer_index ?? qa.questions?.correct_answer ?? 0,
          is_correct: qa.is_correct,
          explanation: qa.quiz_questions?.explanation || qa.questions?.explanation || "Không có giải thích",
          topic: qa.quiz_questions?.topic || qa.questions?.topics?.name || "Unknown",
          subject: "Môn học",
          difficulty: "basic",
        })) || [];

        setAnswers(formattedAnswers);
        
        // Auto-expand wrong answers
        const wrongAnswers = new Set<number>(
          formattedAnswers.map((ans: QuizAnswerData, idx: number) => (!ans.is_correct ? idx : -1)).filter((idx: number) => idx !== -1)
        );
        setExpandedQuestions(wrongAnswers);
      } catch (err) {
        console.error("Error fetching quiz answers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAnswers();
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết từng câu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Đang tải kết quả...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (answers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết từng câu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {answers.map((answer, index) => {
          const isExpanded = expandedQuestions.has(index);
          const isCorrect = answer.is_correct;

          return (
            <div
              key={index}
              className={`rounded-lg border-2 p-4 transition-all ${
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
                        {answer.topic}
                      </Badge>
                      <Badge
                        variant={isCorrect ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {isCorrect ? "Đúng" : "Sai"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{answer.question_text}</p>
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
                    {answer.options.map((option, optIdx) => {
                      const isUserAnswer = optIdx === answer.selected_answer;
                      const isCorrectAnswer = optIdx === answer.correct_answer;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border-2 transition-colors ${
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
                            <span className="text-sm flex-1">{typeof option === "string" ? option : (option as any)?.text || ""}</span>
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
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <span className="text-lg">💡</span> Giải thích:
                    </p>
                    <MarkdownRenderer content={answer.explanation} />
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
