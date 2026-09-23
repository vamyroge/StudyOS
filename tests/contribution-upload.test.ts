import { describe, expect, it } from "vitest";
import { CONTRIBUTION_MAX_FILE_SIZE, validateContributionFile } from "@/lib/rag/contribution-upload";

describe("knowledge contribution file validation", () => {
  it("accepts supported text files", () => {
    expect(validateContributionFile(new File(["notes"], "notes.md", { type: "text/markdown" }))).toBeNull();
  });

  it("rejects unsupported file types and oversized files", () => {
    expect(validateContributionFile(new File(["pdf"], "notes.pdf", { type: "application/pdf" }))).toContain("TXT");
    expect(validateContributionFile(new File([new Uint8Array(CONTRIBUTION_MAX_FILE_SIZE + 1)], "large.txt", { type: "text/plain" }))).toContain("10MB");
  });
});
