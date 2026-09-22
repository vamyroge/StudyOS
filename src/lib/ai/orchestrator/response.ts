import type { OrchestratorResponse, AIRole, AIIntent } from "./types";

export function buildResponse(params: {
  content: string;
  role: AIRole;
  intent: AIIntent;
  sources?: OrchestratorResponse["sources"];
  confidence?: number;
  insufficientEvidence?: boolean;
}): OrchestratorResponse {
  return {
    content: params.content,
    role: params.role,
    intent: params.intent,
    sources: params.sources || [],
    confidence: params.confidence ?? 0.5,
    insufficientEvidence: params.insufficientEvidence ?? false,
  };
}
