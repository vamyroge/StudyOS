const DEFAULT_FLAGS: Record<string, boolean> = {
  adaptive_learning_enabled: false,
  proactive_ai_enabled: false,
  graph_retrieval_enabled: false,
  hybrid_rag_enabled: false,
};

let flags: Record<string, boolean> = { ...DEFAULT_FLAGS };

export function getFeatureFlag(name: string): boolean {
  return flags[name] ?? false;
}

export function getAllFeatureFlags(): Record<string, boolean> {
  return { ...flags };
}

export function setFeatureFlags(newFlags: Record<string, boolean>): void {
  flags = { ...flags, ...newFlags };
}

export function initFeatureFlagsFromEnv(): void {
  if (process.env.NEXT_PUBLIC_ADAPTIVE_LEARNING_ENABLED === "true") {
    flags.adaptive_learning_enabled = true;
  }
  if (process.env.NEXT_PUBLIC_PROACTIVE_AI_ENABLED === "true") {
    flags.proactive_ai_enabled = true;
  }
}
