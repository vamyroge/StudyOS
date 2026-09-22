import type { AICompletionRequest, AICompletionResponse, AIConfig } from "./types";
import { getAIConfig } from "./config";

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
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`AI API error (${response.status}).`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || "",
    model: data.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
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
