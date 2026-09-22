import { requireAuth } from "@/lib/auth/utils";
import { getQuestions, getQuestionOptions, getSubjects } from "@/lib/questions/service";
import { ProtectedLayout } from "@/components/protected-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./question-card";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  await requireAuth();
  const params = await searchParams;
  const subjects = await getSubjects();
  const questions = await getQuestions(params?.subject ? { subjectId: params.subject } : undefined);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">Ngân hàng câu hỏi</h1>
      <p className="mt-2 text-muted-foreground">Luyện tập và kiểm tra kiến thức.</p>

      <div className="mt-6 flex gap-2 flex-wrap">
        <Link href="/questions">
          <Button variant={!params?.subject ? "default" : "outline"} size="sm">Tất cả</Button>
        </Link>
        {subjects.map((s) => (
          <Link key={s.id} href={`/questions?subject=${s.id}`}>
            <Button variant={params?.subject === s.id ? "default" : "outline"} size="sm">
              {s.name}
            </Button>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            <p>Chưa có câu hỏi nào. Vui lòng quay lại sau.</p>
          </div>
        ) : (
          questions.map(async (q) => (
            <QuestionWithOptions key={q.id} question={q} />
          ))
        )}
      </div>
      </div>
    </ProtectedLayout>
  );
}

async function QuestionWithOptions({ question }: { question: Awaited<ReturnType<typeof getQuestions>>[0] }) {
  const options = await getQuestionOptions(question.id);
  return <QuestionCard question={question} options={options} />;
}
