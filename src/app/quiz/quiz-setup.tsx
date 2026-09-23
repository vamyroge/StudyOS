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

export function QuizSetup({ subjects }: QuizSetupProps) {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"basic" | "intermediate" | "advanced">("intermediate");
  const [useAdaptive, setUseAdaptive] = useState(false);
  const [recommendedDifficulty, setRecommendedDifficulty] = useState<"basic" | "intermediate" | "advanced" | null>(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recommended difficulty when subject changes
  useEffect(() => {
    if (selectedSubject && useAdaptive) {
      getRecommendedDifficulty(selectedSubject).then(setRecommendedDifficulty);
    }
  }, [selectedSubject, useAdaptive]);

  // Reset adaptive when subject changes
  useEffect(() => {
    setRecommendedDifficulty(null);
  }, [selectedSubject]);

  async function handleStartQuiz() {
    if (!selectedSubject) {
      setError("Vui lòng chọn môn học");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get subject name
      const subject = subjects.find(s => s.id === selectedSubject);
      if (!subject) {
        setError("Môn học không hợp lệ");
        return;
      }

      // Use adaptive difficulty if enabled
      const finalDifficulty = useAdaptive && recommendedDifficulty ? recommendedDifficulty : difficulty;

      // Generate quiz questions
      const { success, questions, error: genError } = await generateQuiz({
        subject: subject.name,
        difficulty: finalDifficulty,
        numberOfQuestions,
      });

      if (!success || !questions) {
        setError(genError || "Không thể tạo quiz");
        return;
      }

      // Create assessment
      const { success: createSuccess, assessmentId, error: createError } = await createQuizAssessment({
        subjectId: selectedSubject,
        quizType: "quick_assessment",
        totalQuestions: questions.length,
        difficultyLevel: useAdaptive ? "adaptive" : finalDifficulty,
      });

      if (!createSuccess || !assessmentId) {
        setError(createError || "Không thể tạo assessment");
        return;
      }

      // Store questions in sessionStorage and navigate to quiz
      sessionStorage.setItem(`quiz_${assessmentId}`, JSON.stringify(questions));
      router.push(`/quiz/${assessmentId}`);
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartPersonalizedQuiz() {
    if (!selectedSubject) {
      setError("Vui lòng chọn môn học");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (!subject) {
        setError("Môn học không hợp lệ");
        return;
      }

      // Generate personalized quiz
      const { success, questions, error: genError } = await generatePersonalizedQuiz({
        subject: subject.name,
        numberOfQuestions,
      });

      if (!success || !questions) {
        setError(genError || "Không thể tạo quiz cá nhân hóa");
        return;
      }

      // Create assessment
      const { success: createSuccess, assessmentId, error: createError } = await createQuizAssessment({
        subjectId: selectedSubject,
        quizType: "personalized",
        totalQuestions: questions.length,
        difficultyLevel: "adaptive",
      });

      if (!createSuccess || !assessmentId) {
        setError(createError || "Không thể tạo assessment");
        return;
      }

      sessionStorage.setItem(`quiz_${assessmentId}`, JSON.stringify(questions));
      router.push(`/quiz/${assessmentId}`);
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Assessment */}
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
          {/* Subject Selection */}
          <div className="space-y-3">
            <Label>Môn học</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSubject === subject.id
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

          {/* Number of Questions */}
          <div className="space-y-3">
            <Label>Số câu hỏi</Label>
            <div className="flex gap-3">
              {[10, 20, 30].map((num) => (
                <Button
                  key={num}
                  variant={numberOfQuestions === num ? "default" : "outline"}
                  onClick={() => setNumberOfQuestions(num)}
                  disabled={loading}
                >
                  {num} câu
                </Button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-3">
            <Label>Mức độ</Label>
            
            {/* Adaptive Toggle */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant={useAdaptive ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAdaptive(!useAdaptive)}
                disabled={loading || !selectedSubject}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Adaptive (AI tự điều chỉnh)
              </Button>
              {useAdaptive && recommendedDifficulty && (
                <span className="text-xs text-muted-foreground">
                  Đề xuất: {recommendedDifficulty === "basic" ? "Cơ bản" : 
                           recommendedDifficulty === "intermediate" ? "Trung bình" : "Nâng cao"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={!useAdaptive && difficulty === "basic" ? "default" : "outline"}
                onClick={() => {
                  setUseAdaptive(false);
                  setDifficulty("basic");
                }}
                disabled={loading || useAdaptive}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-semibold">Cơ bản</span>
                <span className="text-xs opacity-80">Mới bắt đầu</span>
              </Button>
              <Button
                variant={!useAdaptive && difficulty === "intermediate" ? "default" : "outline"}
                onClick={() => {
                  setUseAdaptive(false);
                  setDifficulty("intermediate");
                }}
                disabled={loading || useAdaptive}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-semibold">Trung bình</span>
                <span className="text-xs opacity-80">Có nền tảng</span>
              </Button>
              <Button
                variant={!useAdaptive && difficulty === "advanced" ? "default" : "outline"}
                onClick={() => {
                  setUseAdaptive(false);
                  setDifficulty("advanced");
                }}
                disabled={loading || useAdaptive}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-semibold">Nâng cao</span>
                <span className="text-xs opacity-80">Học sinh giỏi</span>
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStartQuiz}
            disabled={loading || !selectedSubject}
            className="w-full"
            size="lg"
          >
            {loading ? (
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

      {/* Personalized Quiz */}
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
          {/* Subject Selection */}
          <div className="space-y-3">
            <Label>Môn học</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSubject === subject.id
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

          {/* Number of Questions */}
          <div className="space-y-3">
            <Label>Số câu hỏi</Label>
            <div className="flex gap-3">
              {[10, 20, 30].map((num) => (
                <Button
                  key={num}
                  variant={numberOfQuestions === num ? "default" : "outline"}
                  onClick={() => setNumberOfQuestions(num)}
                  disabled={loading}
                >
                  {num} câu
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              💡 Quiz này sẽ tập trung vào những phần bạn còn yếu dựa trên lịch sử học tập
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStartPersonalizedQuiz}
            disabled={loading || !selectedSubject}
            className="w-full"
            size="lg"
          >
            {loading ? (
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
