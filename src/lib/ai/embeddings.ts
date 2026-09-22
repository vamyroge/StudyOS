export type EmbeddingProvider = "huggingface" | "openai-compatible";

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  dimension: number;
}

const HUGGING_FACE_URL = "https://router.huggingface.co/hf-inference/models";

export function getEmbeddingConfig(): EmbeddingConfig | null {
  const provider = process.env.EMBEDDING_PROVIDER || "openai-compatible";
  const model = process.env.EMBEDDING_MODEL || "";
  const dimension = Number(process.env.EMBEDDING_DIMENSION);
  if (!model || !Number.isInteger(dimension) || dimension <= 0) return null;

  if (provider === "huggingface") {
    const apiKey = process.env.EMBEDDING_API_KEY || process.env.HF_TOKEN || "";
    if (!apiKey) return null;
    return { provider, apiKey, model, dimension };
  }

  if (provider === "openai-compatible") {
    const apiKey = process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY || "";
    const baseUrl = process.env.EMBEDDING_BASE_URL || process.env.AI_BASE_URL || "";
    if (!apiKey || !baseUrl) return null;
    return { provider, apiKey, baseUrl: baseUrl.replace(/\/$/, ""), model, dimension };
  }

  return null;
}

export async function createEmbedding(input: string): Promise<number[]> {
  const config = getEmbeddingConfig();
  if (!config) throw new Error("Embedding provider is not configured.");

  const response = config.provider === "huggingface"
    ? await fetch(`${HUGGING_FACE_URL}/${config.model}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ inputs: { source_sentence: input, sentences: [input] } }),
        signal: AbortSignal.timeout(20_000),
      })
    : await fetch(`${config.baseUrl}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model: config.model, input }),
        signal: AbortSignal.timeout(20_000),
      });

  if (!response.ok) throw new Error("Embedding provider error.");
  const data: unknown = await response.json();
  const embedding = config.provider === "huggingface"
    ? extractHuggingFaceEmbedding(data)
    : extractOpenAICompatibleEmbedding(data);

  if (embedding.length !== config.dimension) {
    throw new Error(`Embedding dimension mismatch: expected ${config.dimension}, received ${embedding.length}.`);
  }
  return embedding;
}

function extractHuggingFaceEmbedding(data: unknown): number[] {
  if (!Array.isArray(data)) {
    throw new Error("Embedding provider returned an invalid response.");
  }
  if (typeof data[0] === "number") {
    return data as number[];
  }
  if (Array.isArray(data[0]) && typeof data[0][0] === "number") {
    return data[0] as number[];
  }
  throw new Error("Embedding provider returned an invalid response.");
}

function extractOpenAICompatibleEmbedding(data: unknown): number[] {
  const embedding = (data as { data?: Array<{ embedding?: unknown }> })?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || !embedding.every((value) => typeof value === "number")) {
    throw new Error("Embedding provider returned an invalid embedding response.");
  }
  return embedding as number[];
}

