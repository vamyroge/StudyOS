import { createAdminClient } from "@/lib/supabase/server";
import type { Role } from "@/types";

export async function logAudit(params: { actorId: string; actorRole: Role; action: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown> }) {
  const supabase = await createAdminClient();
  await supabase.from("audit_logs").insert({
    actor_id: params.actorId,
    actor_role: params.actorRole,
    action: params.action,
    target_type: params.targetType || null,
    target_id: params.targetId || null,
    metadata: params.metadata || null,
  });
}

export async function logAIUsage(params: { userId: string; provider: string; model: string; requestType: string; inputTokens: number; outputTokens: number; totalTokens: number; latencyMs: number; status: "success" | "error"; error?: string }) {
  const supabase = await createAdminClient();
  await supabase.from("ai_usage_logs").insert({
    user_id: params.userId,
    provider: params.provider,
    model: params.model,
    request_type: params.requestType,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    total_tokens: params.totalTokens,
    latency_ms: params.latencyMs,
    status: params.status,
    error: params.error || null,
  });
}
