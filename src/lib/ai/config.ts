import type { AIConfig, AIProvider } from "./types";

const PROVIDER_DEFAULTS: Record<AIProvider, { baseUrl: string; model: string }> = {
  "9router": {
    baseUrl: "http://localhost:20128/v1",
    model: "",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
  },
  omniroute: {
    baseUrl: "https://api.omniroute.ai/v1",
    model: "omniroute/auto",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  xkiro: {
    baseUrl: "https://api.xkiro.com/v1",
    model: "openai/gpt-5.6-sol",
  },
  custom: {
    baseUrl: "",
    model: "",
  },
};

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || "9router") as AIProvider;
  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.openrouter;
  const isXkiro = provider === "xkiro";

  return {
    provider,
    apiKey: (isXkiro ? process.env.XKIRO_API_KEY : undefined) || process.env.AI_API_KEY || "",
    baseUrl: (isXkiro ? process.env.XKIRO_BASE_URL : undefined) || process.env.AI_BASE_URL || defaults.baseUrl,
    model: (isXkiro ? process.env.XKIRO_MODEL : undefined) || process.env.AI_MODEL || defaults.model,
    maxTokens: process.env.AI_MAX_TOKENS ? parseInt(process.env.AI_MAX_TOKENS) : 4096,
    temperature: process.env.AI_TEMPERATURE ? parseFloat(process.env.AI_TEMPERATURE) : 0.7,
  };
}
