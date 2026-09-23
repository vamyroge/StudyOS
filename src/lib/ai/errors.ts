export type AIErrorCode =
  | "AI_TIMEOUT"
  | "AI_UPSTREAM_502"
  | "AI_UPSTREAM_503"
  | "AI_UPSTREAM_504"
  | "AI_RATE_LIMIT"
  | "AI_AUTH_ERROR"
  | "AI_BAD_REQUEST"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_MALFORMED_RESPONSE"
  | "AI_UNKNOWN_ERROR";

export class AIProviderError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    public readonly status: number,
    public readonly retryable: boolean,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export function toAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new AIProviderError("AI_TIMEOUT", 504, true, "AI request timed out", error);
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new AIProviderError("AI_TIMEOUT", 504, true, "AI request timed out", error);
  }

  return new AIProviderError("AI_UNKNOWN_ERROR", 502, false, "Unexpected AI provider error", error);
}

export function clientMessageForAIError(code: AIErrorCode): string {
  switch (code) {
    case "AI_RATE_LIMIT":
      return "AI đang nhận nhiều yêu cầu. Hãy thử lại sau ít phút.";
    case "AI_AUTH_ERROR":
      return "Dịch vụ AI hiện chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.";
    case "AI_BAD_REQUEST":
      return "Yêu cầu chưa hợp lệ. Hãy rút ngắn hoặc diễn đạt lại câu hỏi.";
    case "AI_TIMEOUT":
    case "AI_UPSTREAM_502":
    case "AI_UPSTREAM_503":
    case "AI_UPSTREAM_504":
    case "AI_PROVIDER_UNAVAILABLE":
      return "AI đang tạm thời không phản hồi. Hãy thử lại.";
    default:
      return "AI chưa thể xử lý yêu cầu này. Hãy thử lại sau.";
  }
}
