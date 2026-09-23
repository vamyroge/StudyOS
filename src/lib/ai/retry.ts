import { AIProviderError, toAIProviderError } from "./errors";

export const MAX_AI_RETRIES = 5;
const DEFAULT_RETRY_BUDGET_MS = 120_000;

function getRetryBudgetMs(): number {
  const value = Number.parseInt(process.env.AI_RETRY_BUDGET_MS || "", 10);
  return Number.isFinite(value) && value >= 5_000 && value <= 120_000
    ? value
    : DEFAULT_RETRY_BUDGET_MS;
}

function waitForRetry(attempt: number) {
  const baseDelay = 300 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 250);
  return new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
}

export async function retryTransientAIRequest<T>(operation: () => Promise<T>): Promise<{ result: T; retryCount: number }> {
  let lastError: AIProviderError | undefined;
  const startedAt = Date.now();
  const retryBudgetMs = getRetryBudgetMs();

  for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt += 1) {
    try {
      return { result: await operation(), retryCount: attempt };
    } catch (error) {
      lastError = toAIProviderError(error);
      if (!lastError.retryable || attempt === MAX_AI_RETRIES) break;
      if (Date.now() - startedAt >= retryBudgetMs) break;
      await waitForRetry(attempt);
      if (Date.now() - startedAt >= retryBudgetMs) break;
    }
  }

  throw lastError || new AIProviderError("AI_UNKNOWN_ERROR", 502, false, "AI completion failed");
}
