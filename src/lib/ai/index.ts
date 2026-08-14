// AI provider factory (spec #92).
//
// Selects the active provider based on:
//   1. OPENAI_API_KEY env var present  -> OpenAIProvider (real)
//   2. otherwise                       -> DemoProvider (z-ai-web-dev-sdk)
//
// Both implement the same AIProvider interface, so the rest of the app is
// provider-agnostic. Org-level AISetting.provider can also force "demo".

import { openAIProvider } from "./openai-provider";
import { demoProvider } from "./demo-provider";
import type { AIProvider, AIProviderName } from "./types";

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Returns the provider that should be used given env + org preference. */
export function getProvider(
  preferred?: AIProviderName | string | null,
): AIProvider {
  const openaiConfigured = isOpenAIConfigured();
  if (preferred === "openai" && openaiConfigured) return openAIProvider;
  if (preferred === "demo") return demoProvider;
  // default: real OpenAI when configured, else demo fallback
  return openaiConfigured ? openAIProvider : demoProvider;
}

export function effectiveProviderName(
  preferred?: AIProviderName | string | null,
): AIProviderName {
  return getProvider(preferred).name;
}

export { openAIProvider, demoProvider };
export type { AIProvider, AIProviderName } from "./types";
