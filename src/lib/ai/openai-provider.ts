// OpenAIProvider - real OpenAI integration using the official `openai` SDK.
// (spec #72, #92, #93)
//
// The API key is read ONLY from server-side env vars and is never exposed to
// the browser. All provider-specific code stays here.

import OpenAI from "openai";
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

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

function client(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export class OpenAIProvider implements AIProvider {
  readonly name: AIProviderName = "openai";

  async status(): Promise<ProviderStatus> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        available: false,
        provider: "openai",
        model: DEFAULT_MODEL,
        embeddingModel: DEFAULT_EMBEDDING_MODEL,
        reason: "OPENAI_API_KEY is not configured.",
      };
    }
    return {
      available: true,
      provider: "openai",
      model: DEFAULT_MODEL,
      embeddingModel: DEFAULT_EMBEDDING_MODEL,
    };
  }

  async generateText(
    messages: ChatMessage[],
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const openai = client();
    if (!openai) {
      throw new Error("OpenAI provider is not configured (missing API key).");
    }
    const model = options.model || DEFAULT_MODEL;
    const finalMessages: ChatMessage[] = options.system
      ? [{ role: "system", content: options.system }, ...messages]
      : messages;

    const completion = await openai.chat.completions.create({
      model,
      messages: finalMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutput ?? 1024,
      response_format: options.json ? { type: "json_object" } : undefined,
    });

    const text = completion.choices[0]?.message?.content || "";
    return {
      text,
      model,
      inputTokens: completion.usage?.prompt_tokens ?? estimateTokens(
        finalMessages.map((m) => m.content).join("\n"),
      ),
      outputTokens: completion.usage?.completion_tokens ?? estimateTokens(text),
      provider: "openai",
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
      confidence: typeof parsed?.confidence === "number" ? parsed.confidence : 0.5,
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

  async embed(text: string, model?: string): Promise<EmbedResult> {
    const openai = client();
    if (!openai) {
      throw new Error("OpenAI provider is not configured (missing API key).");
    }
    const embedModel = model || DEFAULT_EMBEDDING_MODEL;
    const res = await openai.embeddings.create({
      model: embedModel,
      input: text,
    });
    const vector = res.data[0]?.embedding || [];
    return {
      vector,
      model: embedModel,
      inputTokens: res.usage?.prompt_tokens ?? estimateTokens(text),
      provider: "openai",
    };
  }
}

export const openAIProvider = new OpenAIProvider();
