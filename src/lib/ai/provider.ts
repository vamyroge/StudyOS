import type { AICompletionRequest, AICompletionResponse, AIConfig } from "./types";
import { getAIConfig } from "./config";
import { AIProviderError, toAIProviderError } from "./errors";

const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

function getRequestTimeoutMs(): number {
  const value = Number.parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "", 10);
  return Number.isFinite(value) && value >= 1_000 && value <= 120_000
    ? value
    : DEFAULT_REQUEST_TIMEOUT_MS;
}

function errorForStatus(status: number): AIProviderError {
  if (status === 400 || status === 422) return new AIProviderError("AI_BAD_REQUEST", status, false, "AI request was rejected");
  if (status === 401 || status === 403) return new AIProviderError("AI_AUTH_ERROR", status, false, "AI provider authentication failed");
  if (status === 429) return new AIProviderError("AI_RATE_LIMIT", status, false, "AI provider rate limit reached");
  if (status === 502) return new AIProviderError("AI_UPSTREAM_502", status, true, "AI upstream returned 502");
  if (status === 503) return new AIProviderError("AI_UPSTREAM_503", status, true, "AI upstream returned 503");
  if (status === 504) return new AIProviderError("AI_UPSTREAM_504", status, true, "AI upstream returned 504");
  if (status >= 500) return new AIProviderError("AI_PROVIDER_UNAVAILABLE", status, true, "AI provider is unavailable");
  return new AIProviderError("AI_UNKNOWN_ERROR", 502, false, "AI provider returned an unexpected status");
}

export async function createCompletion(
  request: AICompletionRequest,
  configOverride?: Partial<AIConfig>
): Promise<AICompletionResponse> {
  const config = { ...getAIConfig(), ...configOverride };

  if (!config.apiKey) {
    throw new Error("AI API key is not configured. Set AI_API_KEY environment variable.");
  }
  if (!config.model) {
    throw new Error("AI model is not configured. Set AI_MODEL environment variable.");
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || config.model,
        messages: request.messages,
        max_tokens: request.maxTokens || config.maxTokens,
        temperature: request.temperature ?? config.temperature,
        stream: false,
      }),
      signal: AbortSignal.timeout(getRequestTimeoutMs()),
    });
  } catch (error) {
    throw toAIProviderError(error);
  }

  if (!response.ok) throw errorForStatus(response.status);

  let data: { choices?: Array<{ message?: { content?: unknown } }>; model?: unknown; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
  try {
    data = await response.json();
  } catch (error) {
    throw new AIProviderError("AI_MALFORMED_RESPONSE", 502, false, "AI provider returned invalid JSON", error);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AIProviderError("AI_MALFORMED_RESPONSE", 502, false, "AI provider returned no message content");
  }

  return {
    content,
    model: typeof data.model === "string" ? data.model : request.model || config.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        }
      : undefined,
  };
}

export async function createStreamingCompletion(
  request: AICompletionRequest,
  configOverride?: Partial<AIConfig>
): Promise<Response> {
  const config = { ...getAIConfig(), ...configOverride };

  if (!config.apiKey) {
    throw new Error("AI API key is not configured. Set AI_API_KEY environment variable.");
  }
  if (!config.model) {
    throw new Error("AI model is not configured. Set AI_MODEL environment variable.");
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model || config.model,
      messages: request.messages,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature ?? config.temperature,
      stream: true,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`AI API error (${response.status}).`);
  }

  return response;
}
