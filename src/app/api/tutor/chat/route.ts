import { z } from "zod";
import { createCompletion } from "@/lib/ai/provider";
import { getAIConfig } from "@/lib/ai/config";
import { detectIntent } from "@/lib/ai/orchestrator/intent";
import { routeRole } from "@/lib/ai/orchestrator/role-router";
import { applyGuardrails } from "@/lib/ai/orchestrator/guardrails";
import { buildContext } from "@/lib/ai/orchestrator/context";
import { checkPrivacy } from "@/lib/ai/orchestrator/privacy";
import { retrieveRelevantChunks, buildContextFromChunks } from "@/lib/rag/service";
import { logAIUsage } from "@/lib/audit/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rate = checkRateLimit(`tutor:${user.id}`, 20, 60_000);
  if (!rate.allowed) return new Response("Too many requests", { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid request", { status: 400 });

  const admin = await createAdminClient();
  let conversationId = parsed.data.conversationId;
  if (conversationId) {
    const { data: conversation } = await admin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();
    if (!conversation) return new Response("Conversation not found", { status: 404 });
  } else {
    const { data, error } = await admin
      .from("conversations")
      .insert({ user_id: user.id, title: parsed.data.message.slice(0, 100) })
      .select("id")
      .single();
    if (error || !data) return new Response("Could not create conversation", { status: 500 });
    conversationId = data.id;
  }

  const { error: userMessageError } = await admin.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: parsed.data.message,
  });
  if (userMessageError) return new Response("Could not save message", { status: 500 });

  const [{ data: storedMessages }, { data: studentProfile }, { data: privacySettings }] = await Promise.all([
    admin.from("messages").select("role, content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(12),
    admin.from("student_profiles").select("grade, subjects, learning_goals, target_exam, study_preferences").eq("user_id", user.id).maybeSingle(),
    admin.from("student_profiles").select("id, privacy_settings(*)").eq("user_id", user.id).maybeSingle(),
  ]);
  const privacy = checkPrivacy(privacySettings?.privacy_settings?.[0] || null);
  const intent = detectIntent(parsed.data.message);
  const role = routeRole(intent);
  const studentContext = privacy.allowed ? { profile: studentProfile } : undefined;
  const context = buildContext({ studentId: user.id, intent, role, privacy, studentData: studentContext });
  const history = (storedMessages || []).reverse().slice(0, -1).map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content.slice(0, 2000),
  }));

  let ragContext = "";
  let sources: Array<{ documentId: string; chunk: string; source: string }> = [];
  try {
    const result = await retrieveRelevantChunks(parsed.data.message);
    ragContext = buildContextFromChunks(result.chunks);
    sources = result.sources;
  } catch {
    // Retrieval is optional when embeddings are unavailable; the tutor remains usable.
  }

  const systemPrompt = [
    `You are an AI tutor for Vietnamese high school students (THPT). Role: ${role}. Intent: ${intent}.`,
    "Teach using Understand, Diagnose, Explain, Guide, Practice, Verify. Prefer hints during practice. Never fabricate sources or citations.",
context.privacyAllowed && context.studentContext ? `Student context: ${JSON.stringify(context.studentContext).replace(/`/g, "").slice(0, 500)}` : "Do not use personal student data.",
    ragContext ? `Verified knowledge context:\n${ragContext}` : "No verified knowledge context was retrieved; state uncertainty when evidence is required.",
  ].join("\n\n");
  const startedAt = Date.now();

  try {
    const completion = await createCompletion({
      messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: parsed.data.message }],
    });
    const guardrail = applyGuardrails(completion.content);
    const content = guardrail.modifiedContent || completion.content;
    if (!guardrail.passed) throw new Error("Empty AI response");

    const { error: assistantMessageError } = await admin.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content,
      metadata: { sources: sources.map(({ documentId, source }) => ({ documentId, source })) },
    });
    if (assistantMessageError) return new Response("Response generated but could not be saved", { status: 500 });

    await logAIUsage({
      userId: user.id,
      provider: getAIConfig().provider,
      model: completion.model || getAIConfig().model,
      requestType: "tutor_chat",
      inputTokens: completion.usage?.promptTokens || 0,
      outputTokens: completion.usage?.completionTokens || 0,
      totalTokens: completion.usage?.totalTokens || 0,
      latencyMs: Date.now() - startedAt,
      status: "success",
    });

    return Response.json({ content, conversationId, sources });
  } catch {
    await logAIUsage({
      userId: user.id,
      provider: getAIConfig().provider,
      model: getAIConfig().model,
      requestType: "tutor_chat",
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs: Date.now() - startedAt,
      status: "error",
      error: "AI request failed",
    }).catch(() => undefined);
    return new Response("AI provider error", { status: 502 });
  }
}
