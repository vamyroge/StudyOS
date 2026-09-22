"use server";

import { requireAuth } from "@/lib/auth/utils";
import { submitAttempt } from "@/lib/questions/service";
import { revalidatePath } from "next/cache";

export type SubmitAnswerState =
  | { error: string }
  | { attempt: { id: string }; isCorrect: boolean }
  | null;

export async function submitAnswer(_previousState: SubmitAnswerState, formData: FormData): Promise<SubmitAnswerState> {
  const user = await requireAuth();
  const questionId = formData.get("questionId") as string;
  const answer = formData.get("answer") as string;

  if (!questionId || !answer) {
    return { error: "Thiếu thông tin câu trả lời." };
  }

  try {
    const result = await submitAttempt(user.id, questionId, answer);
    revalidatePath("/dashboard");
    revalidatePath("/progress");
    revalidatePath("/questions");
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Không thể lưu kết quả." };
  }
}
