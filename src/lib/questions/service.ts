import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateRecommendations, logMistake, updateMastery } from "@/lib/learning/engine";
import type { Question } from "@/types";

export async function getQuestions(filters?: { subjectId?: string; difficulty?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
  if (filters?.difficulty) query = query.eq("difficulty", parseFloat(filters.difficulty));

  const { data, error } = await query;
  if (error || !data) return [];
  return data as Question[];
}

export async function getQuestionById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as Question;
}

export async function getQuestionOptions(questionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_options")
    .select("*")
    .eq("question_id", questionId)
    .order('"order"', { ascending: true });
  if (error || !data) return [];
  return data.map((option) => ({
    id: option.id,
    question_id: option.question_id,
    content: option.content,
    order: option.order,
  }));
}

export async function getQuestionOptionsBatch(questionIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_options")
    .select("*")
    .in("question_id", questionIds)
    .order("question_id", { ascending: true })
    .order('"order"', { ascending: true });
  if (error || !data) return {};
  
  const optionsByQuestion: Record<string, typeof data> = {};
  for (const option of data) {
    if (!optionsByQuestion[option.question_id]) {
      optionsByQuestion[option.question_id] = [];
    }
    optionsByQuestion[option.question_id].push(option);
  }
  
  return Object.entries(optionsByQuestion).reduce((acc, [questionId, options]) => ({
    ...acc,
    [questionId]: options.map((option) => ({
      id: option.id,
      question_id: option.question_id,
      content: option.content,
      order: option.order,
    })),
  }), {} as Record<string, Array<{ id: string; question_id: string; content: string; order: number }>>);
}

export async function getSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects").select("*");
  if (error || !data) return [];
  return data;
}

export async function submitAttempt(studentId: string, questionId: string, answer: string) {
  const supabase = await createAdminClient();
  const { data: question } = await supabase
    .from("questions")
    .select("id, status")
    .eq("id", questionId)
    .eq("status", "approved")
    .single();
  if (!question) throw new Error("Câu hỏi không hợp lệ.");

  const { data: selectedOption } = await supabase
    .from("question_options")
    .select("id, is_correct")
    .eq("id", answer)
    .eq("question_id", questionId)
    .single();
  if (!selectedOption) throw new Error("Đáp án không thuộc câu hỏi này.");
  const isCorrect = selectedOption.is_correct;

  const { data, error } = await supabase
    .from("attempts")
    .insert({ student_id: studentId, question_id: questionId, answer, is_correct: isCorrect })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: mappings } = await supabase
    .from("question_concepts")
    .select("concept_id")
    .eq("question_id", questionId);
  for (const mapping of mappings || []) {
    await updateMastery(studentId, mapping.concept_id, isCorrect);
    if (!isCorrect && data) await logMistake(data.id, studentId, mapping.concept_id, "unknown");
  }
  await generateRecommendations(studentId);
  return { attempt: data, isCorrect };
}
