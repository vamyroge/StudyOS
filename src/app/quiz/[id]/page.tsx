"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { submitQuizAnswer, completeQuizAssessment, type QuizQuestion, getQuizQuestions } from "@/lib/quiz/service";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/async-client";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface QuizQuestionWithId extends QuizQuestion {
  id: string;
}

export default function QuizTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestionWithId[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; answerIndex: number; correct: boolean }>>([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function loadQuiz() {
      const { id } = await params;
      setAssessmentId(id);
      
      // Try to load from database first
      try {
        const supabase = await createClient();
        const { data: quizQuestions } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("assessment_id", id)
          .order("question_order", { ascending: true });

        if (quizQuestions && quizQuestions.length > 0) {
          const formattedQuestions = quizQuestions.map((q: any) => ({
            id: q.id,
            question: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer_index,
            explanation: q.explanation,
            subject: "",
            topic: q.topic || "",
            difficulty: q.difficulty || "basic",
          }));
          setQuestions(formattedQuestions);
          setInitialLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to load questions from database:", error);
      }

      // Fallback to sessionStorage for backward compatibility
      const stored = sessionStorage.getItem(`quiz_${id}`);
      if (stored) {
        const storedQuestions = JSON.parse(stored);
        // Add temporary IDs for sessionStorage questions
        const questionsWithIds = storedQuestions.map((q: QuizQuestion, idx: number) => ({
          ...q,
          id: `temp_${idx}`,
        }));
        setQuestions(questionsWithIds);
      } else {
        router.push("/quiz");
      }
      setInitialLoading(false);
    }
    
    loadQuiz();
  }, [params, router]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Markdown renderer for STEM content (Math, Physics, Chemistry)
  const MarkdownRenderer = ({ content }: { content: string }) => (
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

  async function handleAnswer(answerIndex: number) {
    if (showResult || loading) return;

    setSelectedAnswer(answerIndex);
    setLoading(true);

    // SERVER-SIDE GRADING: Submit to server and get result
    const result = await submitQuizAnswer({
      assessmentId,
      quizQuestionId: currentQuestion.id,
      selectedAnswerIndex: answerIndex,
    });

    if (!result.success) {
      console.error("Failed to submit answer:", result.error);
      setLoading(false);
      return;
    }

    // Use server-calculated result
    const isCorrect = result.isCorrect ?? false;
    setAnswers([...answers, { questionId: currentQuestion.id, answerIndex, correct: isCorrect }]);
    
    setShowResult(true);
    setLoading(false);
  }

  async function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Complete quiz - prevent double submission
      if (submitting) return;
      
      setSubmitting(true);
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      const result = await completeQuizAssessment({ assessmentId, durationSeconds: duration });
      
      if (!result.success) {
        console.error("Failed to complete quiz:", result.error);
        alert("Không thể hoàn thành quiz. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }
      
      sessionStorage.removeItem(`quiz_${assessmentId}`);
      router.push(`/quiz/result/${assessmentId}`);
    }
  }

  if (initialLoading || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Đang tải quiz...</p>
        </div>
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
              <span>Câu {currentIndex + 1}/{questions.length}</span>
            </div>
            <div className="text-sm font-medium">
              {answers.filter(a => a.correct).length}/{answers.length} đúng
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                  {currentQuestion.topic}
                </span>
                <span className="px-2 py-1 bg-muted rounded text-xs">
                  {currentQuestion.difficulty === "basic" ? "Cơ bản" : 
                   currentQuestion.difficulty === "intermediate" ? "Trung bình" : "Nâng cao"}
                </span>
              </div>
              <h2 className="text-xl font-semibold leading-relaxed">
                <MarkdownRenderer content={currentQuestion.question} />
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && handleAnswer(index)}
                    disabled={showResult || loading}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      showCorrect
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : showWrong
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${showResult ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        showCorrect
                          ? "bg-green-500 text-white"
                          : showWrong
                          ? "bg-red-500 text-white"
                          : "bg-muted"
                      }`}>
                        {showCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                         showWrong ? <XCircle className="h-4 w-4" /> :
                         String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">
                        <MarkdownRenderer content={option} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Giải thích:</p>
                <div className="text-sm text-muted-foreground">
                  <MarkdownRenderer content={currentQuestion.explanation} />
                </div>
              </div>
            )}

            {/* Next Button */}
            {showResult && (
              <Button
                onClick={handleNext}
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang hoàn thành...
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
