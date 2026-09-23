import { requireAuth } from "@/lib/auth/utils";
import { getQuestions, getQuestionOptionsBatch, getSubjects } from "@/lib/questions/service";
import { ProtectedLayout } from "@/components/protected-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuestionCard } from "./question-card";
import { BookOpen, Filter } from "lucide-react";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  await requireAuth();
  const params = await searchParams;
  const subjects = await getSubjects();
  const questions = await getQuestions(params?.subject ? { subjectId: params.subject } : undefined);
  
  // Batch fetch options for all questions (fix N+1 queries)
  const questionIds = questions.map((q) => q.id);
  const optionsByQuestion = questionIds.length > 0 ? await getQuestionOptionsBatch(questionIds) : {};

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Ngân hàng câu hỏi
          </h1>
          <p className="mt-2 text-muted-foreground">
            Luyện tập và kiểm tra kiến thức của bạn
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Lọc theo môn học</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/questions">
              <Button 
                variant={!params?.subject ? "default" : "outline"} 
                size="sm"
              >
                Tất cả
              </Button>
            </Link>
            {subjects.map((s) => (
              <Link key={s.id} href={`/questions?subject=${s.id}`}>
                <Button 
                  variant={params?.subject === s.id ? "default" : "outline"} 
                  size="sm"
                >
                  {s.name}
                </Button>
              </Link>
            ))}
          </div>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Chưa có câu hỏi</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {params?.subject 
                    ? "Không có câu hỏi nào cho môn học này. Hãy thử chọn môn khác."
                    : "Chưa có câu hỏi nào trong hệ thống. Vui lòng quay lại sau."
                  }
                </p>
                {params?.subject && (
                  <Link href="/questions" className="mt-4">
                    <Button variant="outline" size="sm">
                      Xem tất cả câu hỏi
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            questions.map((q) => (
              <QuestionWithOptions key={q.id} question={q} options={optionsByQuestion[q.id] || []} />
            ))
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

async function QuestionWithOptions({ question, options }: { question: Awaited<ReturnType<typeof getQuestions>>[0]; options: Array<{ id: string; question_id: string; content: string; order: number }> }) {
  return <QuestionCard question={question} options={options} />;
}
