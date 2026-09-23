import { createHash } from "crypto";
import { createEmbedding, getEmbeddingConfig } from "@/lib/ai/embeddings";
import { chunkText, mapWithConcurrency } from "@/lib/rag/ingestion";
import type { createAdminClient } from "@/lib/supabase/server";

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

export type ApprovedContribution = {
  id: string;
  submitter_id: string;
  title: string;
  content: string;
  source: string | null;
  subject_id: string | null;
  storage_path?: string | null;
};

export async function publishApprovedContribution(admin: AdminClient, contribution: ApprovedContribution) {
  const config = getEmbeddingConfig();
  if (!config) throw new Error("Embedding provider is not configured.");

  const storagePath = contribution.storage_path || `contributions/${contribution.id}`;
  const { data: document, error: documentError } = await admin
    .from("documents")
    .insert({
      title: contribution.title,
      subject_id: contribution.subject_id,
      storage_path: storagePath,
      file_type: "text/plain",
      created_by: contribution.submitter_id,
    })
    .select("id")
    .single();
  if (documentError || !document) throw new Error("Could not create contribution document.");

  const { data: version, error: versionError } = await admin
    .from("document_versions")
    .insert({
      document_id: document.id,
      version: 1,
      content_hash: createHash("sha256").update(contribution.content).digest("hex"),
      source: contribution.source || "student_contribution",
      status: "processing",
      created_by: contribution.submitter_id,
    })
    .select("id")
    .single();
  if (versionError || !version) throw new Error("Could not create contribution version.");

  try {
    const chunks = chunkText(contribution.content);
    const { data: insertedChunks, error: chunkError } = await admin
      .from("document_chunks")
      .insert(chunks.map((content, chunkIndex) => ({
        document_version_id: version.id,
        content,
        chunk_index: chunkIndex,
        metadata: {
          source: contribution.source || "student_contribution",
          contribution_id: contribution.id,
          provenance: "approved_student_contribution",
        },
      })))
      .select("id, content");
    if (chunkError || !insertedChunks) throw new Error("Could not create contribution chunks.");

    const embeddings = await mapWithConcurrency(insertedChunks, 3, async (chunk) => ({
      chunk_id: chunk.id,
      embedding: `[${(await createEmbedding(chunk.content)).join(",")}]`,
      embedding_model: config.model,
      embedding_dimension: config.dimension,
      embedding_version: "v1",
    }));
    const { error: embeddingError } = await admin.from("document_embeddings").insert(embeddings);
    if (embeddingError) throw new Error("Could not store contribution embeddings.");

    const { error: readyError } = await admin.from("document_versions").update({ status: "ready" }).eq("id", version.id);
    if (readyError) throw new Error("Could not mark contribution ready.");
    return { documentId: document.id, versionId: version.id, chunkCount: chunks.length };
  } catch (error) {
    await admin.from("document_versions").update({ status: "failed" }).eq("id", version.id);
    throw error;
  }
}
