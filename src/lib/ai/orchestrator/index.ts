import type { OrchestratorRequest, OrchestratorResponse } from "./types";
import { detectIntent } from "./intent";
import { checkPrivacy } from "./privacy";
import { routeRole } from "./role-router";
import { buildContext } from "./context";
import { applyGuardrails } from "./guardrails";
import { buildResponse } from "./response";
import { createCompletion } from "../provider";

export async function orchestrate(
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  const intent = detectIntent(request.message);
  const role = routeRole(intent);
  const privacy = checkPrivacy(null);
  const context = buildContext({
    studentId: request.studentId,
    intent,
    role,
    privacy,
  });

  const systemPrompt = buildSystemPrompt(role, intent, context.privacyAllowed);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(request.conversationHistory || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: request.message },
  ];

  const completion = await createCompletion({ messages });
  const guardrail = applyGuardrails(completion.content);

  const finalContent = guardrail.modifiedContent || completion.content;

  return buildResponse({
    content: finalContent,
    role,
    intent,
    confidence: 0.7,
    insufficientEvidence: false,
  });
}

function buildSystemPrompt(
  role: string,
  intent: string,
  personalizationAllowed: boolean
): string {
  const base = `You are an AI tutor for Vietnamese high school students (THPT). Your current role is: ${role}. The student's intent is: ${intent}.`;
  const behavior = `Follow this teaching approach: Understand → Diagnose → Explain → Guide → Practice → Verify. Do not always give direct answers. Prefer hints and scaffolding during practice. Distinguish between verified knowledge, model reasoning, uncertain information, and insufficient evidence. Never fabricate sources or citations.`;
  const privacy = personalizationAllowed
    ? "You have access to the student's learning profile for personalization."
    : "You do NOT have access to the student's personal learning data. Provide general guidance only.";

  return `${base}\n${behavior}\n${privacy}`;
}

export { detectIntent } from "./intent";
export { checkPrivacy } from "./privacy";
export { routeRole } from "./role-router";
export { buildContext } from "./context";
export { applyGuardrails } from "./guardrails";
export { buildResponse } from "./response";
export type * from "./types";
