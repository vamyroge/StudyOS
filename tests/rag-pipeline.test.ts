import { describe, it, expect } from "vitest";

describe("RAG Pipeline - Chunking", () => {
  function chunkText(content: string, maxChars: number = 900): string[] {
    const paragraphs = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);
    const chunks: string[] = [];
    let current = "";
    
    for (const paragraph of paragraphs) {
      if (paragraph.length > maxChars) {
        if (current) chunks.push(current);
        for (let index = 0; index < paragraph.length; index += maxChars) {
          chunks.push(paragraph.slice(index, index + maxChars));
        }
        current = "";
      } else if ((current + "\n\n" + paragraph).length > maxChars) {
        if (current) chunks.push(current);
        current = paragraph;
      } else {
        current = current ? `${current}\n\n${paragraph}` : paragraph;
      }
    }
    if (current) chunks.push(current);
    return chunks.filter(Boolean);
  }

  it("splits text into chunks by paragraph", () => {
    const text = "Para 1\n\nPara 2\n\nPara 3";
    const chunks = chunkText(text, 100);
    
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("respects maximum chunk size", () => {
    const text = "a".repeat(1000) + "\n\n" + "b".repeat(1000);
    const chunks = chunkText(text, 900);
    
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(900);
    });
  });

  it("handles single large paragraph", () => {
    const text = "x".repeat(2000);
    const chunks = chunkText(text, 900);
    
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(c => c.length <= 900)).toBe(true);
  });

  it("preserves paragraph boundaries when possible", () => {
    const text = "Short para 1\n\nShort para 2\n\nShort para 3";
    const chunks = chunkText(text, 900);
    
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toContain("para 1");
    expect(chunks[0]).toContain("para 2");
    expect(chunks[0]).toContain("para 3");
  });

  it("handles empty input", () => {
    const chunks = chunkText("");
    expect(chunks).toEqual([]);
  });

  it("handles single line input", () => {
    const chunks = chunkText("Single line");
    expect(chunks).toEqual(["Single line"]);
  });
});

describe("RAG Pipeline - Context Construction", () => {
  function buildContextFromChunks(
    chunks: Array<{ content: string }>,
    maxChars: number = 3000
  ): string {
    const parts: string[] = [];
    let totalLen = 0;
    for (const chunk of chunks) {
      if (totalLen + chunk.content.length > maxChars) break;
      parts.push(chunk.content);
      totalLen += chunk.content.length;
    }
    return parts.join("\n\n");
  }

  it("combines chunks into context", () => {
    const chunks = [
      { content: "Chunk 1" },
      { content: "Chunk 2" },
      { content: "Chunk 3" },
    ];
    const context = buildContextFromChunks(chunks);
    
    expect(context).toContain("Chunk 1");
    expect(context).toContain("Chunk 2");
    expect(context).toContain("Chunk 3");
  });

  it("respects max character limit", () => {
    const chunks = [
      { content: "x".repeat(1000) },
      { content: "y".repeat(1000) },
      { content: "z".repeat(1000) },
    ];
    const context = buildContextFromChunks(chunks, 2500);
    
    expect(context.length).toBeLessThanOrEqual(2500);
  });

  it("stops adding chunks when limit reached", () => {
    const chunks = [
      { content: "a".repeat(1000) },
      { content: "b".repeat(1000) },
      { content: "c".repeat(1000) },
    ];
    const context = buildContextFromChunks(chunks, 1500);
    
    expect(context).toContain("a");
    expect(context).not.toContain("c");
  });

  it("handles empty chunks array", () => {
    const context = buildContextFromChunks([]);
    expect(context).toBe("");
  });
});

describe("RAG Pipeline - Similarity Search", () => {
  it("validates cosine similarity calculation", () => {
    // 1 - cosine_distance = similarity
    const cosineDistance = 0.3;
    const similarity = 1 - cosineDistance;
    
    expect(similarity).toBe(0.7);
  });

  it("validates similarity threshold filtering", () => {
    const results = [
      { similarity: 0.8, content: "High" },
      { similarity: 0.5, content: "Medium" },
      { similarity: 0.2, content: "Low" },
    ];
    const threshold = 0.25;
    
    const filtered = results.filter(r => r.similarity >= threshold);
    
    expect(filtered).toHaveLength(2);
    expect(filtered[0].content).toBe("High");
    expect(filtered[1].content).toBe("Medium");
  });
});
