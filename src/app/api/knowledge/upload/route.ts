import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createEmbedding, getEmbeddingConfig } from "@/lib/ai/embeddings";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["text/plain", "text/markdown", "text/csv"];
const BUCKET = "knowledge-documents";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const rate = checkRateLimit(`knowledge-upload:${user.id}`, 10, 60 * 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many uploads" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const formData = await req.formData();
  const file = formData.get("file");
  const subjectId = formData.get("subjectId");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File must be between 1 byte and 10MB" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Only UTF-8 TXT, Markdown, and CSV are supported. PDF/OCR processing is not configured." }, { status: 415 });
  if (!getEmbeddingConfig()) return NextResponse.json({ error: "Embedding provider is not configured" }, { status: 503 });

  const content = await file.text();
  if (!content.trim()) return NextResponse.json({ error: "File has no extractable text" }, { status: 400 });

  const objectPath = `${user.id}/${Date.now()}-${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: storageError } = await admin.storage.from(BUCKET).upload(objectPath, file, { contentType: file.type, upsert: false });
  if (storageError) return NextResponse.json({ error: "Could not store document" }, { status: 500 });

  const { data: document, error: documentError } = await admin.from("documents").insert({ title: file.name, subject_id: typeof subjectId === "string" && subjectId ? subjectId : null, storage_path: objectPath, file_type: file.type, created_by: user.id }).select("id").single();
  if (documentError || !document) {
    await admin.storage.from(BUCKET).remove([objectPath]);
    return NextResponse.json({ error: "Could not create document" }, { status: 500 });
  }

  const { data: version, error: versionError } = await admin.from("document_versions").insert({ document_id: document.id, version: 1, content_hash: createHash("sha256").update(content).digest("hex"), source: "admin_upload", status: "processing", created_by: user.id }).select("id").single();
  if (versionError || !version) return NextResponse.json({ error: "Could not create document version" }, { status: 500 });
  const { data: job } = await admin.from("document_processing_jobs").insert({ document_id: document.id, status: "processing", started_at: new Date().toISOString() }).select("id").single();

  try {
    const chunks = chunkText(content);
    const { data: insertedChunks, error: chunkError } = await admin.from("document_chunks").insert(chunks.map((chunk, index) => ({ document_version_id: version.id, content: chunk, chunk_index: index, metadata: { source: file.name, subject_id: subjectId || null } }))).select("id, content");
    if (chunkError || !insertedChunks) throw new Error("Could not store chunks");
    const embeddingConfig = getEmbeddingConfig();
    const embeddings = [];
    for (const chunk of insertedChunks) embeddings.push({ chunk_id: chunk.id, embedding: `[${(await createEmbedding(chunk.content)).join(",")}]`, embedding_model: embeddingConfig!.model, embedding_dimension: embeddingConfig!.dimension, embedding_version: "v1" });
    const { error: embeddingError } = await admin.from("document_embeddings").insert(embeddings);
    if (embeddingError) throw new Error("Could not store embeddings");
    await admin.from("document_versions").update({ status: "ready" }).eq("id", version.id);
    if (job) await admin.from("document_processing_jobs").update({ status: "completed", progress: 1, completed_at: new Date().toISOString() }).eq("id", job.id);
    return NextResponse.json({ documentId: document.id, versionId: version.id, chunks: chunks.length, status: "READY" }, { status: 201 });
  } catch {
    await admin.from("document_versions").update({ status: "failed" }).eq("id", version.id);
    if (job) await admin.from("document_processing_jobs").update({ status: "failed", error_message: "Document processing failed", completed_at: new Date().toISOString() }).eq("id", job.id);
    return NextResponse.json({ error: "Document processing failed" }, { status: 500 });
  }
}

function chunkText(content: string, maxChars: number = 900) {
  const paragraphs = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) chunks.push(current);
      for (let index = 0; index < paragraph.length; index += maxChars) chunks.push(paragraph.slice(index, index + maxChars));
      current = "";
    } else if ((current + "\n\n" + paragraph).length > maxChars) {
      if (current) chunks.push(current);
      current = paragraph;
    } else current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}
