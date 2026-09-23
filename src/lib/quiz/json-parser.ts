/**
 * Safe JSON parser for AI-generated quiz responses
 * Handles markdown code fences, malformed JSON, and special characters
 */

interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Extract JSON from AI response that might contain markdown code fences or extra text
 */
function extractJSON(content: string): string | null {
  // Remove markdown code fences if present
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object boundaries
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return null;
}

/**
 * Safely parse JSON string from AI with error recovery
 */
export function parseAIJSON<T>(content: string): ParseResult<T> {
  if (!content || typeof content !== 'string') {
    return { success: false, error: "Empty or invalid content" };
  }

  // Extract JSON from potential markdown or extra text
  const jsonString = extractJSON(content);
  if (!jsonString) {
    return { success: false, error: "No JSON found in response" };
  }

  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (error) {
    // Log the problematic JSON for debugging
    console.error("JSON parse error:", error);
    console.error("Attempted to parse:", jsonString.substring(0, 500));
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid JSON"
    };
  }
}

/**
 * Validate that content is safe for JSON encoding
 * Used for debugging - shows what characters might cause issues
 */
export function validateJSONSafety(str: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for unescaped quotes
  if (str.match(/(?<!\\)"/g)) {
    issues.push("Unescaped double quotes found");
  }
  
  // Check for unescaped backslashes (except valid escape sequences)
  if (str.match(/\\(?!["\\/bfnrtu])/g)) {
    issues.push("Invalid escape sequences found");
  }
  
  // Check for raw newlines/tabs
  if (str.match(/[\n\r\t]/g)) {
    issues.push("Raw control characters found (should be \\n, \\r, \\t)");
  }
  
  return {
    safe: issues.length === 0,
    issues
  };
}
