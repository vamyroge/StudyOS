"use client";

import { useActionState, useEffect } from "react";
import { useLoading } from "@/hooks/use-loading";
import { submitAnswer, type SubmitAnswerState } from "./actions";
import { Button } from "@/components/ui/button";

type Option = { id: string; content: string };

export function QuestionCard({
  question,
  options,
}: {
  question: { id: string; content: string; difficulty: number | null; question_type: string };
  options: Option[];
}) {
  const [state, action, pending] = useActionState<SubmitAnswerState, FormData>(submitAnswer, null);
  const { addLoading, removeLoading } = useLoading();
  const difficultyLabel = question.difficulty !== null ? `${Math.round(question.difficulty * 100)}%` : "N/A";

  useEffect(() => {
    if (pending) {
      addLoading();
    } else {
      removeLoading();
    }
  }, [pending, addLoading, removeLoading]);

  return (
    <form action={action} className="rounded-lg border p-5">
      <input type="hidden" name="questionId" value={question.id} />
      <p className="font-medium whitespace-pre-wrap">{question.content}</p>
      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
        <span>Loại: {question.question_type}</span>
        <span>Độ khó: {difficultyLabel}</span>
      </div>
      <fieldset className="mt-4 space-y-2" disabled={pending || Boolean(state && "isCorrect" in state)}>
        <legend className="sr-only">Chọn đáp án</legend>
        {options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input required type="radio" name="answer" value={option.id} />
            {option.content}
          </label>
        ))}
      </fieldset>
      {options.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Câu hỏi này chưa có đáp án để chấm.</p>}
      {state && "error" in state && <p className="mt-4 text-sm text-destructive">{state.error}</p>}
      {state && "isCorrect" in state && (
        <p className={`mt-4 text-sm font-medium ${state.isCorrect ? "text-green-700" : "text-destructive"}`}>
          {state.isCorrect ? "Chính xác. Tiến độ học tập đã được cập nhật." : "Chưa chính xác. Tiến độ học tập đã được cập nhật để gợi ý ôn tập."}
        </p>
      )}
      <Button className="mt-4" type="submit" disabled={pending || options.length === 0}>
        {pending ? "Đang chấm..." : "Nộp đáp án"}
      </Button>
    </form>
  );
}
