import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/embeddings", () => ({
  getEmbeddingConfig: () => ({ model: "test-model", dimension: 2 }),
  createEmbedding: async () => [0.1, 0.2],
}));

import { publishApprovedContribution } from "@/lib/rag/contributions";

function mockAdmin() {
  const calls: Array<{ table: string; operation: string; value?: unknown }> = [];
  const admin = {
    from(table: string) {
      return {
        insert(value: unknown) {
          calls.push({ table, operation: "insert", value });
          return {
            select() {
              if (table === "document_chunks") {
                return Promise.resolve({ data: [{ id: "chunk-id", content: "chunk content" }], error: null });
              }
              return { single: async () => ({ data: { id: `${table}-id` }, error: null }) };
            },
          };
        },
        update(value: unknown) {
          calls.push({ table, operation: "update", value });
          return { eq: async () => ({ error: null }) };
        },
      };
    },
  };
  return { admin: admin as unknown as Parameters<typeof publishApprovedContribution>[0], calls };
}

describe("approved knowledge contributions", () => {
  it("publishes approved content with provenance before marking it ready", async () => {
    const { admin, calls } = mockAdmin();
    const result = await publishApprovedContribution(admin, {
      id: "contribution-id",
      submitter_id: "student-id",
      title: "Boyle law notes",
      content: "Nội dung kiến thức đủ dài để được xử lý thành contribution hợp lệ.",
      source: "SGK Vật lý 12",
      subject_id: null,
    });

    expect(result.chunkCount).toBe(1);
    expect(calls.map((call) => call.table)).toContain("documents");
    expect(calls.map((call) => call.table)).toContain("document_embeddings");
    expect(calls.find((call) => call.table === "document_versions" && call.operation === "update")?.value).toEqual({ status: "ready" });
  });
});
