import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAIConfig } from "@/lib/ai/config";

describe("getAIConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns custom provider config from env", () => {
    process.env.AI_PROVIDER = "custom";
    process.env.AI_BASE_URL = "http://localhost:20128/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "qwen/test";

    const config = getAIConfig();
    expect(config.provider).toBe("custom");
    expect(config.baseUrl).toBe("http://localhost:20128/v1");
    expect(config.apiKey).toBe("test-key");
    expect(config.model).toBe("qwen/test");
  });

  it("falls back to openrouter defaults", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;

    const config = getAIConfig();
    expect(config.provider).toBe("9router");
    expect(config.baseUrl).toBe("http://localhost:20128/v1");
    expect(config.model).toBe("");
    expect(config.apiKey).toBe("");
  });

  it("uses 9Router configuration from environment", () => {
    process.env.AI_PROVIDER = "9router";
    process.env.AI_BASE_URL = "http://localhost:20128/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "cx/gpt-5.6-terra";

    expect(getAIConfig()).toMatchObject({
      provider: "9router",
      baseUrl: "http://localhost:20128/v1",
      model: "cx/gpt-5.6-terra",
    });
  });

  it("parses maxTokens and temperature", () => {
    process.env.AI_MAX_TOKENS = "2048";
    process.env.AI_TEMPERATURE = "0.3";

    const config = getAIConfig();
    expect(config.maxTokens).toBe(2048);
    expect(config.temperature).toBe(0.3);
  });

  it("uses default maxTokens and temperature when not set", () => {
    delete process.env.AI_MAX_TOKENS;
    delete process.env.AI_TEMPERATURE;

    const config = getAIConfig();
    expect(config.maxTokens).toBe(4096);
    expect(config.temperature).toBe(0.7);
  });
});
