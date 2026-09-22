import { z } from "zod";
import { clientMessageForAIError, toAIProviderError } from "@/lib/ai/errors";
import { getAIConfig } from "@/lib/ai/config";
import { orchestrateTutorResponse } from "@/lib/ai/orchestrator/tutor";
import { logAIUsage } from "@/lib/audit/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  retry: z.boolean().optional(),
});

export async function POST(req: Request) {
  let requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const startedAt = Date.now();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rate = checkRateLimit(`tutor:${user.id}`, 20, 60_000);
  if (!rate.allowed) {
    return Response.json(
      { error: { code: "AI_RATE_LIMIT", message: "AI đang nhận nhiều yêu cầu. Hãy thử lại sau ít phút." }, requestId },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid request", { status: 400 });
  requestId = parsed.data.requestId || requestId;

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

  // Fetch stored messages for history
  const { data: storedMessages } = await admin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (parsed.data.retry) {
    const latestMessage = storedMessages?.[0];
    if (latestMessage?.role !== "user" || latestMessage.content !== parsed.data.message) {
      return Response.json(
        { error: { code: "AI_BAD_REQUEST", message: "Không thể thử lại yêu cầu này. Hãy gửi lại câu hỏi." }, requestId, conversationId },
        { status: 400 },
      );
    }
  }

  if (!parsed.data.retry) {
    const { error: userMessageError } = await admin.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: parsed.data.message,
    });
    if (userMessageError) return new Response("Could not save message", { status: 500 });
  }

  const history = (storedMessages || []).reverse().slice(0, -1).map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content.slice(0, 1200),
  }));

  // Fetch student profile and privacy settings
  const { data: studentProfile } = await admin
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: privacySettings } = await admin
    .from("student_profiles")
    .select("id, privacy_settings(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch student weaknesses (from mistakes analysis)
  const { data: weaknesses } = await admin
    .from("mistakes")
    .select("concept_id")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Enrich profile with weaknesses
  const enrichedProfile: Record<string, unknown> | null = studentProfile ? {
    ...studentProfile,
    weaknesses: (weaknesses || []).map((w: { concept_id: string }) => ({ concept_id: w.concept_id })),
  } : null;

  try {
    const { completion, normalized, sources, intent, retryCount } = await orchestrateTutorResponse({
      requestId,
      studentId: user.id,
      message: parsed.data.message,
      history,
      studentProfile: enrichedProfile,
      privacySettings: privacySettings?.privacy_settings?.[0] || null,
    });

    const { error: assistantMessageError } = await admin.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: normalized.content,
      metadata: { sources },
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

    console.info(`[AI] requestId=${requestId} provider=${getAIConfig().provider} model=${completion.model || getAIConfig().model} intent=${intent} status=success latencyMs=${Date.now() - startedAt} retry=${retryCount}`);
    return Response.json({ ...normalized, conversationId, sources });
  } catch (error) {
    const aiError = toAIProviderError(error);
    console.error(`[AI] requestId=${requestId} provider=${getAIConfig().provider} model=${getAIConfig().model} status=error latencyMs=${Date.now() - startedAt} code=${aiError.code}`, aiError.cause || aiError.message);
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
       error: aiError.code,
    }).catch(() => undefined);
    return Response.json(
      { error: { code: aiError.code, message: clientMessageForAIError(aiError.code) }, requestId, conversationId },
      { status: aiError.status },
    );
  }
}
