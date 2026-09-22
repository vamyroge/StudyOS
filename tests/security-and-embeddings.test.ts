import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmbedding, getEmbeddingConfig } from "@/lib/ai/embeddings";
import { applyGuardrails } from "@/lib/ai/orchestrator/guardrails";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("embedding configuration", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("requires a complete embedding configuration", () => {
    process.env = { ...originalEnv, EMBEDDING_PROVIDER: "huggingface", HF_TOKEN: "", EMBEDDING_MODEL: "", EMBEDDING_DIMENSION: "" };
    expect(getEmbeddingConfig()).toBeNull();
  });

  it("uses Hugging Face feature extraction without exposing the token", async () => {
    process.env = { ...originalEnv, EMBEDDING_PROVIDER: "huggingface", HF_TOKEN: "test-token", EMBEDDING_MODEL: "Qwen/Qwen3-Embedding-0.6B", EMBEDDING_DIMENSION: "3" };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([[0.1, 0.2, 0.3]]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createEmbedding("Vietnamese study text")).resolves.toEqual([0.1, 0.2, 0.3]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://router.huggingface.co/hf-inference/models/Qwen/Qwen3-Embedding-0.6B",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
        body: JSON.stringify({ inputs: { source_sentence: "Vietnamese study text", sentences: ["Vietnamese study text"] } }),
      })
    );
    vi.unstubAllGlobals();
  });

  it("rejects a Hugging Face vector with an unexpected dimension", async () => {
    process.env = { ...originalEnv, EMBEDDING_PROVIDER: "huggingface", HF_TOKEN: "test-token", EMBEDDING_MODEL: "Qwen/Qwen3-Embedding-0.6B", EMBEDDING_DIMENSION: "4" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([[0.1, 0.2, 0.3]]), { status: 200 })));

    await expect(createEmbedding("test")).rejects.toThrow("expected 4, received 3");
    vi.unstubAllGlobals();
  });
});

describe("server protections", () => {
  it("limits repeated requests for the same key", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(false);
  });

  it("rejects empty model output and truncates excessive output", () => {
    expect(applyGuardrails(" ").passed).toBe(false);
    expect(applyGuardrails("x".repeat(10_001)).modifiedContent).toContain("truncated");
  });
});
