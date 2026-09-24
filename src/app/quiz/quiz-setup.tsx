"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Brain, Zap, BookOpen, Loader2, Sparkles } from "lucide-react";
import { generateQuiz, generatePersonalizedQuiz, createQuizAssessment, getRecommendedDifficulty } from "@/lib/quiz/service";

interface QuizSetupProps {
  subjects: Array<{ id: string; name: string }>;
}

interface QuizState {
  selectedSubject: string;
  difficulty: "basic" | "intermediate" | "advanced";
  useAdaptive: boolean;
  recommendedDifficulty: "basic" | "intermediate" | "advanced" | null;
  numberOfQuestions: number;
}

export function QuizSetup({ subjects }: QuizSetupProps) {
  const router = useRouter();
  const [quickQuiz, setQuickQuiz] = useState<QuizState>({
    selectedSubject: "",
    difficulty: "intermediate",
    useAdaptive: false,
    recommendedDifficulty: null,
    numberOfQuestions: 10,
  });
  const [personalizedQuiz, setPersonalizedQuiz] = useState<QuizState>({
    selectedSubject: "",
    difficulty: "intermediate",
    useAdaptive: true,
    recommendedDifficulty: null,
    numberOfQuestions: 10,
  });
  const [quickLoading, setQuickLoading] = useState(false);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quickQuiz.selectedSubject && quickQuiz.useAdaptive) {
      getRecommendedDifficulty(quickQuiz.selectedSubject).then((difficulty) => {
        setQuickQuiz(prev => ({ ...prev, recommendedDifficulty: difficulty }));
      });
    }
  }, [quickQuiz.selectedSubject, quickQuiz.useAdaptive]);

  useEffect(() => {
    if (personalizedQuiz.selectedSubject && personalizedQuiz.useAdaptive) {
      getRecommendedDifficulty(personalizedQuiz.selectedSubject).then((difficulty) => {
        setPersonalizedQuiz(prev => ({ ...prev, recommendedDifficulty: difficulty }));
      });
    }
  }, [personalizedQuiz.selectedSubject, personalizedQuiz.useAdaptive]);

  async function handleStartQuickQuiz() {
    if (!quickQuiz.selectedSubject) {
      setError("Vui lòng chọn môn học cho Quick Assessment");
      return;
    }

    setQuickLoading(true);
    setError(null);

    try {
      const subject = subjects.find(s => s.id === quickQuiz.selectedSubject);
      if (!subject) {
        setError("Môn học không hợp lệ");
        setQuickLoading(false);
        return;
      }

      const finalDifficulty = quickQuiz.useAdaptive && quickQuiz.recommendedDifficulty 
        ? quickQuiz.recommendedDifficulty 
        : quickQuiz.difficulty;

      const { success, questions, error: genError } = await generateQuiz({
        subject: subject.name,
        difficulty: finalDifficulty,
        numberOfQuestions: quickQuiz.numberOfQuestions,
      });

      if (!success || !questions) {
        setError(`Lỗi Quick Quiz: ${genError || "Không thể tạo quiz"}`);
        setQuickLoading(false);
        return;
      }

      const { success: createSuccess, assessmentId, error: createError } = await createQuizAssessment({
        subjectId: quickQuiz.selectedSubject,
        quizType: "quick_assessment",
        totalQuestions: questions.length,
        difficultyLevel: quickQuiz.useAdaptive ? "adaptive" : finalDifficulty,
        questions, // Save questions to database
      });

      if (!createSuccess || !assessmentId) {
        setError(`Lỗi Quick Quiz: ${createError || "Không thể tạo assessment"}`);
        setQuickLoading(false);
        return;
      }

      // Still keep in sessionStorage for backward compatibility and offline access
      sessionStorage.setItem(`quiz_${assessmentId}`, JSON.stringify(questions));
      router.push(`/quiz/${assessmentId}`);
    } catch (err) {
      console.error("Quick quiz error:", err);
      setError(`Lỗi Quick Quiz: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setQuickLoading(false);
    }
  }

  async function handleStartPersonalizedQuiz() {
    if (!personalizedQuiz.selectedSubject) {
      setError("Vui lòng chọn môn học cho Quiz Cá nhân hóa");
      return;
    }

    setPersonalizedLoading(true);
    setError(null);

    try {
      const subject = subjects.find(s => s.id === personalizedQuiz.selectedSubject);
      if (!subject) {
        setError("Môn học không hợp lệ");
        setPersonalizedLoading(false);
        return;
      }

      const { success, questions, error: genError } = await generatePersonalizedQuiz({
        subject: subject.name,
        numberOfQuestions: personalizedQuiz.numberOfQuestions,
      });

      if (!success || !questions) {
        setError(`Lỗi Personalized Quiz: ${genError || "Không thể tạo quiz cá nhân hóa"}`);
        setPersonalizedLoading(false);
        return;
      }

      const { success: createSuccess, assessmentId, error: createError } = await createQuizAssessment({
        subjectId: personalizedQuiz.selectedSubject,
        quizType: "personalized",
        totalQuestions: questions.length,
        difficultyLevel: "adaptive",
        questions, // Save questions to database
      });

      if (!createSuccess || !assessmentId) {
        setError(`Lỗi Personalized Quiz: ${createError || "Không thể tạo assessment"}`);
        setPersonalizedLoading(false);
        return;
      }

      // Still keep in sessionStorage for backward compatibility and offline access
      sessionStorage.setItem(`quiz_${assessmentId}`, JSON.stringify(questions));
      router.push(`/quiz/${assessmentId}`);
    } catch (err) {
      console.error("Personalized quiz error:", err);
      setError(`Lỗi Personalized Quiz: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPersonalizedLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Assessment
          </CardTitle>
          <CardDescription>
            Đánh giá nhanh trình độ hiện tại của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Môn học</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setQuickQuiz(prev => ({ ...prev, selectedSubject: subject.id }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    quickQuiz.selectedSubject === subject.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <BookOpen className="h-5 w-5 mb-2 text-primary" />
                  <p className="font-medium text-sm">{subject.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Số câu hỏi</Label>
            <div className="flex gap-3">
              {[10, 20, 30].map((num) => (
                <Button
                  key={num}
                  variant={quickQuiz.numberOfQuestions === num ? "default" : "outline"}
                  onClick={() => setQuickQuiz(prev => ({ ...prev, numberOfQuestions: num }))}
                  disabled={quickLoading}
                >
                  {num} câu
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Mức độ</Label>
            
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant={quickQuiz.useAdaptive ? "default" : "outline"}
                size="sm"
                onClick={() => setQuickQuiz(prev => ({ ...prev, useAdaptive: !prev.useAdaptive }))}
                disabled={quickLoading || !quickQuiz.selectedSubject}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Adaptive (AI tự điều chỉnh)
              </Button>
              {quickQuiz.useAdaptive && quickQuiz.recommendedDifficulty && (
                <span className="text-xs text-muted-foreground">
                  Đề xuất: {quickQuiz.recommendedDifficulty === "basic" ? "Cơ bản" : 
                           quickQuiz.recommendedDifficulty === "intermediate" ? "Trung bình" : "Nâng cao"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={!quickQuiz.useAdaptive && quickQuiz.difficulty === "basic" ? "default" : "outline"}
                onClick={() => {
                  setQuickQuiz(prev => ({ ...prev, useAdaptive: false, difficulty: "basic" }));
                }}
                disabled={quickLoading || quickQuiz.useAdaptive}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-semibold">Cơ bản</span>
                <span className="text-xs opacity-80">Mới bắt đầu</span>
              </Button>
              <Button
                variant={!quickQuiz.useAdaptive && quickQuiz.difficulty === "intermediate" ? "default" : "outline"}
                onClick={() => {
                  setQuickQuiz(prev => ({ ...prev, useAdaptive: false, difficulty: "intermediate" }));
                }}
                disabled={quickLoading || quickQuiz.useAdaptive}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-semibold">Trung bình</span>
                <span className="text-xs opacity-80">Có nền tảng</span>
              </Button>
              <Button
                variant={!quickQuiz.useAdaptive && quickQuiz.difficulty === "advanced" ? "default" : "outline"}
                onClick={() => {
                  setQuickQuiz(prev => ({ ...prev, useAdaptive: false, difficulty: "advanced" }));
                }}
                disabled={quickLoading || quickQuiz.useAdaptive}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-semibold">Nâng cao</span>
                <span className="text-xs opacity-80">Học sinh giỏi</span>
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleStartQuickQuiz}
            disabled={quickLoading || !quickQuiz.selectedSubject}
            className="w-full"
            size="lg"
          >
            {quickLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo quiz...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Bắt đầu làm bài
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Quiz Cá nhân hóa
          </CardTitle>
          <CardDescription>
            Quiz được tạo dựa trên lịch sử học tập và điểm yếu của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Môn học</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setPersonalizedQuiz(prev => ({ ...prev, selectedSubject: subject.id }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    personalizedQuiz.selectedSubject === subject.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <BookOpen className="h-5 w-5 mb-2 text-primary" />
                  <p className="font-medium text-sm">{subject.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Số câu hỏi</Label>
            <div className="flex gap-3">
              {[10, 20, 30].map((num) => (
                <Button
                  key={num}
                  variant={personalizedQuiz.numberOfQuestions === num ? "default" : "outline"}
                  onClick={() => setPersonalizedQuiz(prev => ({ ...prev, numberOfQuestions: num }))}
                  disabled={personalizedLoading}
                >
                  {num} câu
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              Quiz này sẽ tập trung vào những phần bạn còn yếu dựa trên lịch sử học tập
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleStartPersonalizedQuiz}
            disabled={personalizedLoading || !personalizedQuiz.selectedSubject}
            className="w-full"
            size="lg"
          >
            {personalizedLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang phân tích & tạo quiz...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Bắt đầu quiz cá nhân hóa
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
