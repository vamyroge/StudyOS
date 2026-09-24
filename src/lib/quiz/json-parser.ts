/**
 * Safe JSON parser for AI-generated quiz responses
 * Handles markdown code fences, malformed JSON, and special characters
 * Implements multiple repair strategies for robust parsing
 */

interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attemptedRepairs?: string[];
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

  // Try to find JSON object boundaries (handle nested objects)
  let braceCount = 0;
  let startIndex = -1;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') {
      if (startIndex === -1) startIndex = i;
      braceCount++;
    } else if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        return content.substring(startIndex, i + 1);
      }
    }
  }

  // Fallback to simple regex
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return null;
}

/**
 * Repair common JSON issues from AI responses
 */
function repairJSON(jsonString: string): string {
  let repaired = jsonString;
  
  // Fix trailing commas before closing braces/brackets
  // Handle multiple trailing commas: ,, or ,} or ,]
  repaired = repaired.replace(/,+(\s*[}\]])/g, '$1');
  
  // Fix missing commas between array elements (common AI error)
  repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
  repaired = repaired.replace(/}\s*\n\s*{/g, '},\n{');
  repaired = repaired.replace(/]\s*\n\s*\[/g, '],\n[');
  
  // Fix missing commas between object properties on the same line
  repaired = repaired.replace(/"(\s+)"/g, '", "');
  
  return repaired;
}

/**
 * Attempt to fix truncated JSON (incomplete closing braces)
 */
function fixTruncatedJSON(jsonString: string): string {
  let fixed = jsonString.trim();
  
  // Count opening and closing braces
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  // Add missing closing brackets
  if (openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
  }
  
  // Add missing closing braces
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
  }
  
  return fixed;
}

/**
 * Safely parse JSON string from AI with error recovery
 */
export function parseAIJSON<T>(content: string): ParseResult<T> {
  if (!content || typeof content !== 'string') {
    return { success: false, error: "Empty or invalid content" };
  }

  const attemptedRepairs: string[] = [];

  // Extract JSON from potential markdown or extra text
  const jsonString = extractJSON(content);
  if (!jsonString) {
    return { success: false, error: "No JSON found in response" };
  }

  // Attempt 1: Parse as-is
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (error1) {
    attemptedRepairs.push("direct-parse");
    
    // Attempt 2: Repair common issues
    try {
      const repaired = repairJSON(jsonString);
      const data = JSON.parse(repaired);
      if (process.env.NODE_ENV === "development") {
        console.warn("JSON repaired successfully (common issues)");
      }
      return { success: true, data, attemptedRepairs };
    } catch (error2) {
      attemptedRepairs.push("repair-common");
      
      // Attempt 3: Fix truncated JSON
      try {
        const fixed = fixTruncatedJSON(jsonString);
        const data = JSON.parse(fixed);
        if (process.env.NODE_ENV === "development") {
          console.warn("JSON repaired successfully (truncation)");
        }
        return { success: true, data, attemptedRepairs };
      } catch (error3) {
        attemptedRepairs.push("fix-truncation");
        
        // Log the problematic JSON for debugging
        console.error("JSON parse error after all repair attempts:", error3);
        console.error("Original content length:", content.length);
        console.error("Extracted JSON length:", jsonString.length);
        console.error("First 500 chars:", jsonString.substring(0, 500));
        console.error("Last 500 chars:", jsonString.substring(Math.max(0, jsonString.length - 500)));
        
        // Try to identify the error position
        const errorMatch = (error3 as Error).message.match(/position (\d+)/);
        if (errorMatch) {
          const position = parseInt(errorMatch[1]);
          const start = Math.max(0, position - 100);
          const end = Math.min(jsonString.length, position + 100);
          console.error(`Context around position ${position}:`, jsonString.substring(start, end));
        }
        
        return {
          success: false,
          error: error3 instanceof Error ? error3.message : "Invalid JSON",
          attemptedRepairs
        };
      }
    }
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
