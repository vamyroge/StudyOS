export type AIProvider = "9router" | "openrouter" | "omniroute" | "openai" | "xkiro" | "custom";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AIResponseFormat =
  | "text"
  | "json_object"
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: Record<string, unknown> };

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  responseFormat?: AIResponseFormat;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
