// /api/ai/status — returns the effective AI provider status (spec #102).

import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai";
import { resolveContext } from "@/lib/org-context";
import { getOrgAISettings } from "@/lib/ai/logging";

export async function GET() {
  const { organizationId } = await resolveContext();
  const settings = await getOrgAISettings(organizationId);
  const provider = getProvider(settings.provider);
  const status = await provider.status();

  const aiEnabled = settings.enabled && status.available;

  return NextResponse.json({
    aiEnabled,
    orgEnabled: settings.enabled,
    provider: status.provider,
    available: status.available,
    model: status.model,
    embeddingModel: status.embeddingModel,
    reason: status.reason,
    isDemo: status.provider === "demo",
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
    features: {
      replySuggestions: settings.replySuggestions,
      summaries: settings.summaries,
      translation: settings.translation,
      classification: settings.classification,
      customerSupport: settings.customerSupport,
      campaignGeneration: settings.campaignGeneration,
    },
  });
}
