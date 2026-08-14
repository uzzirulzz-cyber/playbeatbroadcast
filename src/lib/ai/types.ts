// AI Provider abstraction layer (spec #92)
//
// Defines a provider-agnostic interface so the application can swap between
// OpenAI (real) and a built-in demo provider without touching call sites.
// Provider-specific code lives ONLY inside provider implementations.

export type AIProviderName = "openai" | "demo";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxOutput?: number;
  system?: string;
  // JSON-schema-ish hint. Provider may ignore if unsupported.
  json?: boolean;
}

export interface GenerateResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  provider: AIProviderName;
}

export interface ClassifyResult extends GenerateResult {
  label: string;
  confidence: number;
}

export interface EmbedResult {
  vector: number[];
  model: string;
  inputTokens: number;
  provider: AIProviderName;
}

export interface ProviderStatus {
  available: boolean;
  provider: AIProviderName;
  model: string;
  embeddingModel: string;
  reason?: string; // when unavailable
}

/**
 * Provider-agnostic AI interface (spec #92).
 * Additional providers can implement this and be registered in the factory.
 */
export interface AIProvider {
  readonly name: AIProviderName;

  status(): Promise<ProviderStatus>;

  generateText(
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<GenerateResult>;

  summarize(
    text: string,
    options?: GenerateOptions,
  ): Promise<GenerateResult>;

  classify(
    text: string,
    labels: string[],
    options?: GenerateOptions,
  ): Promise<ClassifyResult>;

  translate(
    text: string,
    targetLanguage: string,
    options?: GenerateOptions,
  ): Promise<GenerateResult>;

  embed(text: string, model?: string): Promise<EmbedResult>;
}

// ---------------------------------------------------------------------------
// Shared helpers for parsing structured AI output
// ---------------------------------------------------------------------------

/** Best-effort extraction of a JSON object from an LLM text response. */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  // Strip markdown fences
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to locate the first {...} or [...] block
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]) as T;
      } catch {
        /* ignore */
      }
    }
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]) as T;
      } catch {
        /* ignore */
      }
    }
    return null;
  }
}

/** Rough token estimate (4 chars ~= 1 token). Used only for logging when the
 *  provider does not return usage metadata. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
