// AI logging + org context (spec #95, #96).
//
// AIRequest records store metadata only (feature, model, tokens, latency,
// status). We do NOT store raw prompts/responses indefinitely by default to
// honor the privacy requirement.

import { db } from "@/lib/db";

export interface LogAIRequestInput {
  organizationId: string;
  userId?: string | null;
  feature: string;
  provider: string;
  model?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  status?: string;
  latencyMs?: number;
  errorMessage?: string | null;
}

export async function logAIRequest(input: LogAIRequestInput) {
  try {
    await db.aIRequest.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        feature: input.feature,
        provider: input.provider,
        model: input.model ?? null,
        inputTokens: input.inputTokens ?? 0,
        outputTokens: input.outputTokens ?? 0,
        status: input.status ?? "ok",
        latency: input.latencyMs ?? 0,
        errorMessage: input.errorMessage ?? null,
      },
    });
  } catch (e) {
    // Logging must never break the main flow.
    console.error("[ai] failed to log AI request", e);
  }
}

/**
 * Enforce org-scoped AI privacy (spec #96).
 * Returns the org's AI settings, creating defaults if missing.
 */
export async function getOrgAISettings(organizationId: string) {
  let settings = await db.aISetting.findUnique({
    where: { organizationId },
  });
  if (!settings) {
    settings = await db.aISetting.create({
      data: { organizationId },
    });
  }
  return settings;
}

/**
 * Determine whether a given AI feature is enabled for an org, respecting both
 * the master `enabled` flag and per-feature toggles (spec #91, #102).
 */
export async function isFeatureEnabled(
  organizationId: string,
  feature: string,
): Promise<{ enabled: boolean; reason?: string; settings: Awaited<ReturnType<typeof getOrgAISettings>> }> {
  const settings = await getOrgAISettings(organizationId);
  if (!settings.enabled) {
    return {
      enabled: false,
      reason: "AI features are not enabled for this organization.",
      settings,
    };
  }

  const map: Record<string, boolean> = {
    reply: settings.replySuggestions,
    summary: settings.summaries,
    translation: settings.translation,
    intent: settings.classification,
    sentiment: settings.classification,
    analysis: settings.campaignGeneration,
    subject: settings.campaignGeneration,
    abtest: settings.campaignGeneration,
    image_prompt: settings.campaignGeneration,
    campaign: settings.campaignGeneration,
    rewrite: settings.campaignGeneration,
    kb_answer: settings.customerSupport,
    embed: true,
    classify: settings.classification,
  };
  const enabled = map[feature] ?? true;
  return {
    enabled,
    reason: enabled ? undefined : `Feature '${feature}' is disabled in AI settings.`,
    settings,
  };
}

/** Hard cap on how long we keep AI request logs (spec #95 retention). */
export async function pruneAIRequests(organizationId: string, retentionDays: number) {
  if (retentionDays <= 0) return;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  try {
    await db.aIRequest.deleteMany({
      where: { organizationId, createdAt: { lt: cutoff } },
    });
  } catch (e) {
    console.error("[ai] failed to prune AI requests", e);
  }
}
