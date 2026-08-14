// DemoProvider - graceful fallback when OpenAI is not configured (spec #102).
//
// Uses the in-environment z-ai-web-dev-sdk so AI features remain usable for
// demonstration. It implements the exact same AIProvider interface as the
// OpenAI provider, so swapping is transparent to the rest of the app.
//
// Embeddings: the demo backend does not expose a stable embeddings endpoint,
// so we fall back to a deterministic local hashing-based vector. This is good
// enough for semantic-retrieval *demos* but the OpenAI provider uses real
// text-embedding-3-* vectors in production.

import ZAI from "z-ai-web-dev-sdk";
import {
  type AIProvider,
  type AIProviderName,
  type ChatMessage,
  type ClassifyResult,
  type EmbedResult,
  type GenerateOptions,
  type GenerateResult,
  type ProviderStatus,
  estimateTokens,
  extractJson,
} from "./types";

const DEMO_MODEL = "demo-glm";
const DEMO_EMBED_MODEL = "demo-hash-256";

export class DemoProvider implements AIProvider {
  readonly name: AIProviderName = "demo";

  private async getClient(): Promise<ReturnType<typeof ZAI.create>> {
    return ZAI.create();
  }

  async status(): Promise<ProviderStatus> {
    try {
      await this.getClient();
      return {
        available: true,
        provider: "demo",
        model: DEMO_MODEL,
        embeddingModel: DEMO_EMBED_MODEL,
        reason:
          "Running in demo mode (OpenAI API key not configured). Connect OpenAI in Settings → AI for production use.",
      };
    } catch (e) {
      return {
        available: false,
        provider: "demo",
        model: DEMO_MODEL,
        embeddingModel: DEMO_EMBED_MODEL,
        reason:
          e instanceof Error ? e.message : "Demo provider unavailable.",
      };
    }
  }

  async generateText(
    messages: ChatMessage[],
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const zai = await this.getClient();
    const finalMessages: ChatMessage[] = options.system
      ? [{ role: "system", content: options.system }, ...messages]
      : messages;

    const completion = await zai.chat.completions.create({
      messages: finalMessages as never,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutput ?? 1024,
      thinking: { type: "disabled" },
    } as never);

    const text =
      (completion as { choices?: { message?: { content?: string } }[] })
        ?.choices?.[0]?.message?.content || "";

    return {
      text,
      model: DEMO_MODEL,
      inputTokens: estimateTokens(finalMessages.map((m) => m.content).join("\n")),
      outputTokens: estimateTokens(text),
      provider: "demo",
    };
  }

  async summarize(
    text: string,
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    return this.generateText(
      [
        {
          role: "user",
          content: `Summarize the following conversation/text concisely and accurately. Do not invent details.\n\n---\n${text}\n---`,
        },
      ],
      {
        ...options,
        system:
          options.system ||
          "You are a precise summarization assistant for a customer communications platform.",
      },
    );
  }

  async classify(
    text: string,
    labels: string[],
    options: GenerateOptions = {},
  ): Promise<ClassifyResult> {
    const result = await this.generateText(
      [
        {
          role: "user",
          content: `Classify the following message into exactly ONE of these labels: ${labels.join(", ")}.\nRespond as JSON: {"label": "<one of the labels>", "confidence": <0..1>}\n\nMessage:\n${text}`,
        },
      ],
      {
        ...options,
        temperature: options.temperature ?? 0.2,
        json: true,
        system:
          options.system ||
          "You are a classification engine. Respond only with JSON.",
      },
    );
    const parsed = extractJson<{ label?: string; confidence?: number }>(
      result.text,
    );
    return {
      ...result,
      label: parsed?.label || "Other",
      confidence:
        typeof parsed?.confidence === "number" ? parsed.confidence : 0.5,
    };
  }

  async translate(
    text: string,
    targetLanguage: string,
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    return this.generateText(
      [
        {
          role: "user",
          content: `Translate the following message into ${targetLanguage}. Preserve meaning, tone and any personalization tokens like {{first_name}}. Output only the translation.\n\n---\n${text}\n---`,
        },
      ],
      {
        ...options,
        temperature: options.temperature ?? 0.3,
        system:
          options.system ||
          "You are a professional translator for marketing and customer-support messages.",
      },
    );
  }

  async embed(text: string, _model?: string): Promise<EmbedResult> {
    // Deterministic local hashing vector (256-dim) for demo semantic search.
    const vector = hashVector(text, 256);
    return {
      vector,
      model: DEMO_EMBED_MODEL,
      inputTokens: estimateTokens(text),
      provider: "demo",
    };
  }
}

/** Deterministic 256-dim pseudo-embedding from character n-gram hashing. */
function hashVector(text: string, dims: number): number[] {
  const vec = new Array(dims).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const tri = normalized.slice(i, i + 3);
    if (!tri) continue;
    let h = 2166136261;
    for (let j = 0; j < tri.length; j++) {
      h ^= tri.charCodeAt(j);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % dims;
    vec[idx] += 1;
  }
  // L2 normalize
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

export const demoProvider = new DemoProvider();
