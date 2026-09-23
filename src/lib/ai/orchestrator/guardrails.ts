export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  modifiedContent?: string;
}

export interface SanitizedResponse {
  content: string;
  mode: 'plain_text' | 'explanation' | 'solution' | 'quiz' | 'code';
  hasMarkdown: boolean;
}

export interface NormalizedAIResponse {
  intent: string;
  mode: SanitizedResponse["mode"];
  content: string;
  actions: string[];
  quiz: null;
}

/**
 * Sanitizes AI response to remove unwanted characters and formatting
 * Based on response mode
 */
export function sanitizeAIResponse(content: string, mode: SanitizedResponse['mode'] = 'explanation'): string {
  if (!content) return '';

  let sanitized = content;

  // Remove control characters (except newline, tab, carriage return)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // If not code mode, remove code fences
  if (mode !== 'code') {
    // Remove code blocks but keep content
    sanitized = sanitized.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').replace(/```$/g, '');
      return code.trim();
    });
    
    // Remove inline code markers for simple cases
    sanitized = sanitized.replace(/`([^`]+)`/g, '$1');
  }

  // Remove markdown headings (###, ##, #)
  sanitized = sanitized.replace(/^#{1,6}\s+/gm, '');

  // Remove horizontal rules
  sanitized = sanitized.replace(/^(?:---+|___+|\*\*\*+)\s*$/gm, '');

  // Remove blockquote markers but keep content
  sanitized = sanitized.replace(/^>\s*/gm, '');

  // Remove bold/italic markers (**, __, *, _)
  sanitized = sanitized.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold**
  sanitized = sanitized.replace(/__([^_]+)__/g, '$1'); // __bold__
  sanitized = sanitized.replace(/\*([^*]+)\*/g, '$1'); // *italic*
  sanitized = sanitized.replace(/_([^_]+)_/g, '$1'); // _italic_

  // Normalize whitespace (but preserve Vietnamese)
  sanitized = sanitized.replace(/[ \t]+/g, ' '); // Multiple inline spaces to single
  sanitized = sanitized.replace(/\r\n?/g, '\n');
  sanitized = sanitized.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Max 2 newlines

  // Remove excessive newlines at start/end
  sanitized = sanitized.trim();

  // The client renders plain text, so no HTML should survive normalization.
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Normalize quotes
  sanitized = sanitized.replace(/[""]/g, '"');
  sanitized = sanitized.replace(/['']/g, "'");

  // Remove LaTeX delimiters if not in math mode (basic)
  if (mode !== 'code') {
    // Only remove obvious LaTeX that's not actually math
    sanitized = sanitized.replace(/\\\\/g, '');
  }

  return sanitized;
}

/**
 * Enhanced guardrails with sanitization
 */
export function applyGuardrails(content: string, mode: SanitizedResponse["mode"] = "explanation"): GuardrailResult {
  if (!content || content.trim().length === 0) {
    return { passed: false, reason: "Empty response" };
  }

  // The caller decides the response mode from the user intent, never model text.
  const sanitized = sanitizeAIResponse(content, mode);

  // Check length after sanitization
  if (sanitized.length > 10000) {
    return {
      passed: true,
      modifiedContent: sanitized.slice(0, 10000) + "\n\n[Response truncated for length]",
    };
  }

  // Check for suspicious patterns (potential junk)
  const hasExcessiveMarkdown = (content.match(/#{3,}/g) || []).length > 5;
  const hasExcessiveDashes = (content.match(/---/g) || []).length > 3;
  
  if (hasExcessiveMarkdown || hasExcessiveDashes) {
    return {
      passed: true,
      modifiedContent: sanitized,
    };
  }

  // If content is mostly sanitized away, it was probably junk
  if (sanitized.length < content.length * 0.3 && sanitized.length < 50) {
    return { 
      passed: false, 
      reason: "Response appears to be mostly formatting with little content" 
    };
  }

  return { passed: true, modifiedContent: sanitized };
}

// The server chooses the mode from user intent. Never infer quiz mode from model text.
export function normalizeAIResponse(params: {
  content: string;
  intent: string;
  mode: SanitizedResponse["mode"];
}): NormalizedAIResponse | null {
  const guardrail = applyGuardrails(params.content, params.mode);
  const content = guardrail.modifiedContent || params.content;
  if (!guardrail.passed || !isValidNaturalResponse(content)) return null;

  return {
    intent: params.intent,
    mode: params.mode,
    content,
    actions: [],
    // Quiz generation is intentionally not inferred from unstructured model output.
    quiz: null,
  };
}

/**
 * Validates that content doesn't look like raw JSON or structured data
 */
export function isValidNaturalResponse(content: string): boolean {
  const trimmed = content.trim();
  
  // Check if it looks like raw JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return false; // It's JSON, not natural language
    } catch {
      // Not valid JSON, continue
    }
  }

  return true;
}
