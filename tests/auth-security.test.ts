import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

describe("auth callback redirects", () => {
  it("allows internal application paths", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("/tutor?conversation=abc")).toBe("/tutor?conversation=abc");
  });

  it("rejects protocol-relative and absolute external redirects", () => {
    expect(getSafeRedirectPath("//attacker.example")).toBe("/dashboard");
    expect(getSafeRedirectPath("https://attacker.example")).toBe("/dashboard");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("uses the dashboard when no continuation path is supplied", () => {
    expect(getSafeRedirectPath(null)).toBe("/dashboard");
  });
});
