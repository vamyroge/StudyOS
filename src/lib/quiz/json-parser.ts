/**
 * Safe JSON Parser for AI-generated Quiz Responses
 *
 * Implements a robust multi-stage parsing pipeline:
 * 1. Markdown fence / text boundary extraction
 * 2. Direct JSON.parse
 * 3. Stateful syntax & escape repair (LaTeX backslashes, unescaped quotes, control chars)
 * 4. Truncation and comma repair
 * 5. Structured error reporting and development logging
 */

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attemptedRepairs?: string[];
  rawError?: {
    message: string;
    position?: number;
    line?: number;
    column?: number;
  };
}

/**
 * Extract JSON from AI response that might contain markdown code fences or extra text
 */
export function extractJSON(content: string): string | null {
  if (!content || typeof content !== "string") return null;

  // 1. Remove markdown code fences if present
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    const candidate = codeBlockMatch[1].trim();
    if (candidate.startsWith("{") || candidate.startsWith("[")) {
      return candidate;
    }
  }

  // 2. Find balanced JSON object boundaries (handle nested objects)
  let braceCount = 0;
  let startIndex = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      if (startIndex === -1) startIndex = i;
      braceCount++;
    } else if (char === "}" || char === "]") {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        return content.substring(startIndex, i + 1).trim();
      }
    }
  }

  // 3. Fallback to outer brace matching
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return content.substring(firstBrace, lastBrace + 1).trim();
  }

  return null;
}

/**
 * Scans JSON text and safely repairs invalid escape sequences, unescaped quotes,
 * and control characters inside string literals without regex-replacing all backslashes.
 */
export function repairJSONEscapes(jsonString: string): string {
  let result = "";
  let inString = false;
  let i = 0;
  const len = jsonString.length;

  while (i < len) {
    const char = jsonString[i];

    if (!inString) {
      if (char === '"') {
        inString = true;
        result += char;
        i++;
      } else {
        result += char;
        i++;
      }
    } else {
      // Inside string literal
      if (char === "\\") {
        const next = jsonString[i + 1];
        if (next === undefined) {
          result += "\\\\";
          i++;
          break;
        }

        // Standard valid JSON escapes: ", \, /, b, f, n, r, t, u
        if (next === '"' || next === "\\" || next === "/") {
          result += char + next;
          i += 2;
        } else if (next === "n") {
          result += char + next;
          i += 2;
        } else if (next === "f") {
          // Check for LaTeX command: \frac, \flat, \forall
          const remainder = jsonString.substring(i + 1, i + 8);
          if (/^frac\b|^flat\b|^forall\b/i.test(remainder)) {
            result += "\\\\f";
            i += 2;
          } else {
            result += char + next; // standard formfeed escape
            i += 2;
          }
        } else if (next === "t") {
          // Check for LaTeX command: \times, \theta, \text, \tan, \tau
          const remainder = jsonString.substring(i + 1, i + 8);
          if (/^times\b|^theta\b|^text\b|^tan\b|^tau\b/i.test(remainder)) {
            result += "\\\\t";
            i += 2;
          } else {
            result += char + next; // standard tab escape
            i += 2;
          }
        } else if (next === "b") {
          // Check for LaTeX command: \beta, \bar, \begin, \bf
          const remainder = jsonString.substring(i + 1, i + 8);
          if (/^beta\b|^bar\b|^begin\b|^bf\b/i.test(remainder)) {
            result += "\\\\b";
            i += 2;
          } else {
            result += char + next; // standard backspace escape
            i += 2;
          }
        } else if (next === "r") {
          // Check for LaTeX command: \rightarrow, \right, \rho, \rangle, \rm
          const remainder = jsonString.substring(i + 1, i + 12);
          if (/^rightarrow\b|^right\b|^rho\b|^rangle\b|^rm\b/i.test(remainder)) {
            result += "\\\\r";
            i += 2;
          } else {
            result += char + next; // standard carriage return escape
            i += 2;
          }
        } else if (next === "u") {
          // Unicode escape \uXXXX
          const hex = jsonString.substring(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            result += char + next + hex;
            i += 6;
          } else {
            // Invalid unicode escape (e.g. \url, \uparrow, \unit)
            result += "\\\\u";
            i += 2;
          }
        } else {
          // Invalid escape character in JSON (e.g. \s in \sqrt, \D in \Delta, \a in \alpha, \p in \pm, etc.)
          // Double backslash so it parses as a literal LaTeX/formula backslash
          result += "\\\\" + next;
          i += 2;
        }
      } else if (char === '"') {
        // Determine if this is a closing quote or an unescaped inner quote
        let k = i + 1;
        while (
          k < len &&
          (jsonString[k] === " " ||
            jsonString[k] === "\t" ||
            jsonString[k] === "\n" ||
            jsonString[k] === "\r")
        ) {
          k++;
        }
        const nextNonWs = jsonString[k];

        // Valid closing quote must precede ':', ',', '}', ']', or end of input
        if (
          nextNonWs === ":" ||
          nextNonWs === "," ||
          nextNonWs === "}" ||
          nextNonWs === "]" ||
          k >= len
        ) {
          inString = false;
          result += char;
          i++;
        } else {
          // Unescaped quote inside string literal -> escape it as \"
          result += '\\"';
          i++;
        }
      } else if (char === "\n") {
        // Raw unescaped newline inside string literal
        result += "\\n";
        i++;
      } else if (char === "\r") {
        // Raw unescaped carriage return inside string literal
        result += "\\r";
        i++;
      } else if (char === "\t") {
        // Raw unescaped tab inside string literal
        result += "\\t";
        i++;
      } else {
        result += char;
        i++;
      }
    }
  }

  return result;
}

/**
 * Repair common JSON syntax errors (trailing commas, missing commas)
 */
export function repairJSONSyntax(jsonString: string): string {
  let repaired = jsonString;

  // Fix trailing commas before closing braces/brackets
  repaired = repaired.replace(/,+(\s*[}\]])/g, "$1");

  // Fix missing commas between array elements or objects on separate lines
  repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
  repaired = repaired.replace(/}\s*\n\s*{/g, "},\n{");
  repaired = repaired.replace(/]\s*\n\s*\[/g, "],\n[");

  return repaired;
}

/**
 * Attempt to fix truncated JSON (incomplete closing braces or brackets)
 */
export function fixTruncatedJSON(jsonString: string): string {
  let fixed = jsonString.trim();

  // Count unescaped opening and closing braces/brackets outside of strings
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        openBraces++;
      } else if (char === "}") {
        openBraces = Math.max(0, openBraces - 1);
      } else if (char === "[") {
        openBrackets++;
      } else if (char === "]") {
        openBrackets = Math.max(0, openBrackets - 1);
      }
    }
  }

  // Remove any trailing commas before appending closing tokens
  fixed = fixed.replace(/,\s*$/, "");

  // Close brackets first, then braces
  if (openBrackets > 0) {
    fixed += "]".repeat(openBrackets);
  }
  if (openBraces > 0) {
    fixed += "}".repeat(openBraces);
  }

  return fixed;
}

/**
 * Full repair pipeline combining escape repair, syntax repair, and truncation repair
 */
export function repairJSON(jsonString: string): string {
  const escapesFixed = repairJSONEscapes(jsonString);
  const syntaxFixed = repairJSONSyntax(escapesFixed);
  return fixTruncatedJSON(syntaxFixed);
}

/**
 * Safely parse JSON string from AI with progressive error recovery
 */
export function parseAIJSON<T>(content: string): ParseResult<T> {
  if (!content || typeof content !== "string") {
    return { success: false, error: "Empty or invalid content" };
  }

  const attemptedRepairs: string[] = [];

  // Extract JSON from potential markdown or extra surrounding text
  const jsonString = extractJSON(content);
  if (!jsonString) {
    return { success: false, error: "No JSON found in response" };
  }

  // Attempt 1: Parse as-is
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (err1) {
    attemptedRepairs.push("direct-parse");

    // Attempt 2: Safe string escape repair (LaTeX \frac, \sqrt, \Delta, quotes, newlines)
    try {
      const repairedEscapes = repairJSONEscapes(jsonString);
      const data = JSON.parse(repairedEscapes);
      return { success: true, data, attemptedRepairs };
    } catch (err2) {
      attemptedRepairs.push("repair-escapes");

      // Attempt 3: Full repair (escapes + syntax commas + truncation)
      try {
        const fullyRepaired = repairJSON(jsonString);
        const data = JSON.parse(fullyRepaired);
        return { success: true, data, attemptedRepairs };
      } catch (err3) {
        attemptedRepairs.push("repair-full");

        // Parse error position extraction
        const errorMsg = err3 instanceof Error ? err3.message : "Invalid JSON";
        let position: number | undefined;
        let line: number | undefined;
        let column: number | undefined;

        const posMatch = errorMsg.match(/position (\d+)/i);
        if (posMatch) {
          position = parseInt(posMatch[1], 10);
          const linesUpToPos = jsonString.substring(0, position).split("\n");
          line = linesUpToPos.length;
          column = linesUpToPos[linesUpToPos.length - 1].length + 1;
        }

        if (process.env.NODE_ENV === "development") {
          console.error("[QuickQuiz] JSON parse failed", {
            error: errorMsg,
            position,
            line,
            column,
            context: position
              ? jsonString.substring(Math.max(0, position - 40), Math.min(jsonString.length, position + 40))
              : undefined,
          });
        }

        return {
          success: false,
          error: errorMsg,
          attemptedRepairs,
          rawError: {
            message: errorMsg,
            position,
            line,
            column,
          },
        };
      }
    }
  }
}

/**
 * Validate that content is safe for JSON encoding
 * Used for debugging/testing
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
    issues,
  };
}
