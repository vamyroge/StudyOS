"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/utils";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { validateContributionFile } from "@/lib/rag/contribution-upload";

const contributionSchema = z.object({
  title: z.string().trim().min(3).max(300),
  content: z.string().trim().max(20_000),
  source: z.string().trim().max(500).optional(),
  subjectId: z.string().uuid().optional(),
});

export type ContributionState = { error: string } | { success: true } | null;

export async function submitKnowledgeContribution(_previous: ContributionState, formData: FormData): Promise<ContributionState> {
  const user = await requireAuth();
  const fileValue = formData.get("file");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  const fileError = validateContributionFile(file);
  if (fileError) return { error: fileError };
  const parsed = contributionSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    source: formData.get("source") || undefined,
    subjectId: formData.get("subjectId") || undefined,
  });
  if (!parsed.success) return { error: "Vui lòng nhập tiêu đề và nguồn hợp lệ." };

  const fileContent = file ? await file.text() : "";
  const content = parsed.data.content || fileContent;
  if (content.trim().length < 50) return { error: "Hãy nhập hoặc đính kèm ít nhất 50 ký tự nội dung kiến thức." };

  const supabase = await createClient();
  const admin = await createAdminClient();
  let storagePath: string | null = null;
  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    storagePath = `contributions/${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await admin.storage
      .from("knowledge-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) return { error: "Không thể lưu file đính kèm. Vui lòng thử lại." };
  }
  const { data: contribution, error: contributionError } = await supabase
    .from("knowledge_contributions")
    .insert({
      submitter_id: user.id,
      title: parsed.data.title,
      content,
      source: parsed.data.source || null,
      subject_id: parsed.data.subjectId || null,
      storage_path: storagePath,
      file_name: file?.name || null,
      file_type: file?.type || null,
      file_size: file?.size || null,
    })
    .select("id")
    .single();
  if (contributionError || !contribution) {
    if (storagePath) await admin.storage.from("knowledge-documents").remove([storagePath]);
    return { error: "Không thể gửi đóng góp. Vui lòng thử lại." };
  }

  const { error: submissionError } = await supabase.from("submissions").insert({
    submitter_id: user.id,
    target_type: "knowledge_contribution",
    target_id: contribution.id,
    source: parsed.data.source || null,
    status: "pending",
  });
  if (submissionError) return { error: "Đóng góp đã được lưu nhưng chưa thể vào hàng chờ kiểm duyệt. Vui lòng liên hệ quản trị viên." };

  revalidatePath("/knowledge");
  return { success: true };
}
