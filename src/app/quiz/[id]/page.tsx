"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  submitQuizAnswer,
  completeQuizAssessment,
  getQuizAssessmentWithQuestions,
} from "@/lib/quiz/service";
import {
  validateQuizQuestions,
  type NormalizedQuizQuestion,
} from "@/lib/quiz/normalize";
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface QuizTakingPageProps {
  params: Promise<{ id: string }>;
}

// Markdown renderer for STEM content (Math, Physics, Chemistry) declared outside component
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <span className="inline">{children}</span>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function QuizTakingPage({ params }: QuizTakingPageProps) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [questions, setQuestions] = useState<NormalizedQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<
    Array<{ questionId: string; optionId: string; correct: boolean }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const startTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadQuizData() {
      try {
        const { id } = await params;
        if (isCancelled) return;
        setAssessmentId(id);

        let loadedRawQuestions: unknown[] = [];

        // 1. Try server action first
        try {
          const res = await getQuizAssessmentWithQuestions(id);
          if (res.success && res.questions && res.questions.length > 0) {
            loadedRawQuestions = res.questions;
          }
        } catch (err) {
          console.warn("Failed to load via server action, trying browser client:", err);
        }

        // 2. Try browser Supabase client if server action returned empty
        if (loadedRawQuestions.length === 0) {
          try {
            const supabase = createClient();
            const { data: dbQuestions } = await supabase
              .from("quiz_questions")
              .select("*")
              .eq("assessment_id", id)
              .order("question_order", { ascending: true });

            if (dbQuestions && dbQuestions.length > 0) {
              loadedRawQuestions = dbQuestions.map((q: Record<string, unknown>) => ({
                id: q.id,
                question: q.question_text,
                options: q.options,
                correctAnswer: q.correct_answer_index,
                explanation: q.explanation,
                subject: "",
                topic: q.topic || "",
                difficulty: q.difficulty || "basic",
              }));
            }
          } catch (err) {
            console.warn("Failed to load via browser client:", err);
          }
        }

        // 3. Fallback to sessionStorage
        if (loadedRawQuestions.length === 0) {
          const stored = sessionStorage.getItem(`quiz_${id}`);
          if (stored) {
            try {
              const parsedStored = JSON.parse(stored);
              if (Array.isArray(parsedStored) && parsedStored.length > 0) {
                loadedRawQuestions = parsedStored.map((q: Record<string, unknown>, idx: number) => ({
                  ...q,
                  id: q.id || `temp_${idx}`,
                }));
              }
            } catch (e) {
              console.error("Failed to parse sessionStorage quiz data:", e);
            }
          }
        }

        if (isCancelled) return;

        // 4. Validate and normalize questions
        if (loadedRawQuestions.length === 0) {
          setLoadError("Không tìm thấy dữ liệu bài quiz. Vui lòng tạo quiz mới.");
          setInitialLoading(false);
          return;
        }

        const validation = validateQuizQuestions(loadedRawQuestions);
        if (!validation.valid || validation.questions.length === 0) {
          setLoadError(
            validation.error || "Dữ liệu câu hỏi quiz không hợp lệ. Vui lòng thử lại."
          );
          setInitialLoading(false);
          return;
        }

        setQuestions(validation.questions);
        questionStartTimeRef.current = Date.now();
        setLoadError(null);
      } catch (err) {
        if (!isCancelled) {
          console.error("Quiz load error:", err);
          setLoadError("Đã có lỗi xảy ra khi tải bài quiz. Vui lòng thử lại.");
        }
      } finally {
        if (!isCancelled) {
          setInitialLoading(false);
        }
      }
    }

    loadQuizData();

    return () => {
      isCancelled = true;
    };
  }, [params, reloadTrigger]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleSelectOption = useCallback((optionId: string) => {
    if (isAnswered || isSubmitting) return;
    if (!currentQuestion) return;

    // 1. Immediately update UI state (never wait for AI/API)
    setSelectedOptionId(optionId);
    setIsAnswered(true);

    // 2. Determine correct/wrong synchronously
    const isCorrect = optionId === currentQuestion.correctOptionId;

    // 3. Structured debug logging in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("[QUIZ]", {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        correctOptionId: currentQuestion.correctOptionId,
        isAnswered: true,
        isSubmitting: false,
        currentQuestionIndex: currentIndex,
        isCorrect,
      });
    }

    setAnswers((prev) => [
      ...prev,
      { questionId: currentQuestion.id, optionId, correct: isCorrect },
    ]);

    // 4. Background submission to server — does NOT block UI selection
    const optionIndex = currentQuestion.options.findIndex((o) => o.id === optionId);
    const now = Date.now();
    const timeSpent = Math.max(1, Math.floor((now - questionStartTimeRef.current) / 1000));

    submitQuizAnswer({
      assessmentId,
      quizQuestionId: currentQuestion.id,
      selectedAnswerIndex: optionIndex >= 0 ? optionIndex : 0,
      selectedOptionId: optionId,
      timeSpent,
    }).catch((err) => {
      console.error("[QUIZ] Failed to record answer in background:", err);
      // Selection UI is preserved, quiz continues safely
    });
  }, [isAnswered, isSubmitting, currentQuestion, currentIndex, assessmentId]);

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
      questionStartTimeRef.current = Date.now();
    } else {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
        const result = await completeQuizAssessment({
          assessmentId,
          durationSeconds: duration,
        });

        if (!result.success) {
          console.warn("Complete quiz notice:", result.error);
        }

        sessionStorage.removeItem(`quiz_${assessmentId}`);
        router.push(`/quiz/result/${assessmentId}`);
      } catch (error) {
        console.error("Error completing quiz:", error);
        sessionStorage.removeItem(`quiz_${assessmentId}`);
        router.push(`/quiz/result/${assessmentId}`);
      }
    }
  }, [currentIndex, questions.length, isSubmitting, assessmentId, router]);

  // Loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Đang tải quiz...</p>
        </div>
      </div>
    );
  }

  // Graceful error state (e.g. missing correctOptionId, network load failure)
  if (loadError || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="max-w-md w-full p-6 text-center space-y-4 border-destructive/40 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold">Không thể tải bài Quiz</h2>
          <p className="text-sm text-muted-foreground">
            {loadError || "Dữ liệu bài quiz không đầy đủ. Vui lòng thử lại."}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => router.push("/quiz")}>
              Về trang Quiz
            </Button>
            <Button
              onClick={() => {
                setInitialLoading(true);
                setLoadError(null);
                setReloadTrigger((prev) => prev + 1);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Thử tải lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Câu {currentIndex + 1}/{questions.length}
              </span>
            </div>
            <div className="text-sm font-medium">
              {answers.filter((a) => a.correct).length}/{answers.length} đúng
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question Card */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {currentQuestion.topic && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                    {currentQuestion.topic}
                  </span>
                )}
                <span className="px-2 py-1 bg-muted rounded text-xs">
                  {currentQuestion.difficulty === "basic"
                    ? "Cơ bản"
                    : currentQuestion.difficulty === "intermediate"
                    ? "Trung bình"
                    : "Nâng cao"}
                </span>
              </div>
              <h2 className="text-xl font-semibold leading-relaxed">
                <MarkdownRenderer content={currentQuestion.question} />
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = isAnswered && option.id === currentQuestion.correctOptionId;
                const isWrong = isAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => !isAnswered && handleSelectOption(option.id)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isCorrect
                        ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                        : isWrong
                        ? "border-red-500 bg-red-50 dark:bg-red-950/40"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          isCorrect
                            ? "bg-green-500 text-white"
                            : isWrong
                            ? "bg-red-500 text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isWrong ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span className="flex-1 text-sm leading-relaxed">
                        <MarkdownRenderer content={option.text} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation - shown immediately upon answer */}
            {isAnswered && currentQuestion.explanation && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Giải thích:</p>
                <div className="text-sm text-muted-foreground">
                  <MarkdownRenderer content={currentQuestion.explanation} />
                </div>
              </div>
            )}

            {/* Next / Submit Button - available immediately upon answer */}
            {isAnswered && (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tải kết quả...
                  </>
                ) : currentIndex < questions.length - 1 ? (
                  "Câu tiếp theo"
                ) : (
                  "Hoàn thành"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
