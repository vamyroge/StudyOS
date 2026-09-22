import { createClient } from "@/lib/supabase/server";
import { createEmbedding, getEmbeddingConfig } from "@/lib/ai/embeddings";

export interface RAGResult {
  chunks: Array<{
    id: string;
    content: string;
    document_version_id: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }>;
  sources: Array<{
    documentId: string;
    chunk: string;
    source: string;
  }>;
}

export async function retrieveRelevantChunks(query: string, topK: number = 5, filters?: { subjectId?: string }): Promise<RAGResult> {
  const supabase = await createClient();
  if (!getEmbeddingConfig()) return { chunks: [], sources: [] };
  const embedding = await createEmbedding(query);
  const { data, error } = await supabase.rpc("search_chunks", {
    query_embedding: `[${embedding.join(",")}]`,
    match_count: Math.min(Math.max(topK, 1), 10),
    filter_subject_id: filters?.subjectId || null,
  });

  if (error || !data) {
    return { chunks: [], sources: [] };
  }

  const chunks = data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    content: row.content as string,
    document_version_id: row.document_version_id as string,
    metadata: (row.metadata as Record<string, unknown>) || {},
    similarity: row.similarity as number,
  }));

  const sources = chunks.map((c: { document_version_id: string; content: string; metadata: Record<string, unknown> }) => ({
    documentId: c.document_version_id,
    chunk: c.content,
    source: String(c.metadata.source || "knowledge_base"),
  }));

  return { chunks, sources };
}

export function buildContextFromChunks(chunks: RAGResult["chunks"], maxChars: number = 3000): string {
  const parts: string[] = [];
  let totalLen = 0;
  for (const chunk of chunks) {
    if (totalLen + chunk.content.length > maxChars) break;
    parts.push(chunk.content);
    totalLen += chunk.content.length;
  }
  return parts.join("\n\n");
}
