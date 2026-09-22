export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  modifiedContent?: string;
}

export function applyGuardrails(content: string): GuardrailResult {
  if (!content || content.trim().length === 0) {
    return { passed: false, reason: "Empty response" };
  }

  if (content.length > 10000) {
    return {
      passed: true,
      modifiedContent: content.slice(0, 10000) + "\n\n[Response truncated for length]",
    };
  }

  return { passed: true };
}
