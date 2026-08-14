// OpenAIService - high-level AI operations (spec #93).
//
// All provider-specific code lives in the provider layer; this service composes
// provider calls into domain operations (campaign generation, rewriting,
// translation, reply suggestion, summarization, intent detection, sentiment,
// campaign analysis, subject lines, KB answering, etc.).
//
// Every public method:
//   - takes an organizationId (org isolation, spec #96)
//   - checks feature enablement (spec #102)
//   - logs an AIRequest (spec #95)
//   - measures latency
//   - returns a typed result, never throws to the caller on AI failure
//     (returns { ok: false, error })

import { db } from "@/lib/db";
import { getProvider } from "./index";
import { isFeatureEnabled, logAIRequest } from "./logging";
import { retrieveRelevant } from "./embeddings";
import {
  type GenerateResult,
  extractJson,
} from "./types";

export interface AIOutcome<T> {
  ok: boolean;
  data?: T;
  error?: string;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  disabled?: boolean;
}

async function run<T>(
  organizationId: string,
  feature: string,
  userId: string | null,
  fn: () => Promise<T>,
): Promise<AIOutcome<T>> {
  const featureCheck = await isFeatureEnabled(organizationId, feature);
  if (!featureCheck.enabled) {
    return {
      ok: false,
      disabled: true,
      error: featureCheck.reason,
      provider: featureCheck.settings.provider,
    };
  }
  const provider = getProvider(featureCheck.settings.provider);
  const start = Date.now();
  try {
    const data = await fn();
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      data,
      provider: provider.name,
      latencyMs,
    };
  } catch (e) {
    const latencyMs = Date.now() - start;
    const errorMessage = e instanceof Error ? e.message : String(e);
    await logAIRequest({
      organizationId,
      userId,
      feature,
      provider: provider.name,
      status: "error",
      latencyMs,
      errorMessage,
    });
    return { ok: false, error: errorMessage, provider: provider.name, latencyMs };
  }
}

function recordUsage(
  organizationId: string,
  userId: string | null,
  feature: string,
  providerName: string,
  result: GenerateResult | null,
  latencyMs?: number,
  status = "ok",
) {
  if (!result) return;
  return logAIRequest({
    organizationId,
    userId,
    feature,
    provider: providerName,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs,
    status,
  });
}

// ===========================================================================
// Campaign generation (spec #74)
// ===========================================================================

export interface CampaignDraft {
  campaignName: string;
  message: string;
  callToAction: string;
  suggestedAudience: string;
  suggestedTiming: string;
}

export async function generateCampaign(
  organizationId: string,
  userId: string | null,
  brief: {
    description: string;
    goal?: string;
    tone?: string;
    language?: string;
    channel?: string;
    product?: string;
  },
): Promise<AIOutcome<CampaignDraft>> {
  return run<CampaignDraft>(organizationId, "campaign", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "campaign");
    const provider = getProvider(settings.settings.provider);
    const prompt = `Create a marketing campaign draft.

Description: ${brief.description}
Goal: ${brief.goal || "Drive engagement"}
Tone: ${brief.tone || "Professional but friendly"}
Language: ${brief.language || "English"}
Channel: ${brief.channel || "WhatsApp"}
Product/Service: ${brief.product || "N/A"}

Respond as JSON with keys: campaignName, message, callToAction, suggestedAudience, suggestedTiming.`;

    const res = await provider.generateText(
      [{ role: "user", content: prompt }],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are an expert omnichannel marketing copywriter. Produce compliant, non-spammy campaigns. Never fabricate sensitive personal data. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "campaign", provider.name, res);
    const parsed = extractJson<CampaignDraft>(res.text);
    if (!parsed) {
      // Fallback: return the raw text as the message
      return {
        campaignName: "AI Campaign",
        message: res.text,
        callToAction: "Reply to learn more",
        suggestedAudience: "All active contacts",
        suggestedTiming: "Weekday morning",
      };
    }
    return parsed;
  });
}

// ===========================================================================
// Message variations (spec #75)
// ===========================================================================

export interface MessageVariation {
  label: string;
  body: string;
}

export async function generateVariations(
  organizationId: string,
  userId: string | null,
  params: {
    goal: string;
    audience: string;
    product?: string;
    tone: string;
    language: string;
    length: string;
    callToAction?: string;
    count?: number;
  },
): Promise<AIOutcome<MessageVariation[]>> {
  return run<MessageVariation[]>(organizationId, "campaign", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "campaign");
    const provider = getProvider(settings.settings.provider);
    const n = Math.min(5, Math.max(2, params.count || 3));
    const prompt = `Generate ${n} distinct message variations for a broadcast campaign.

Goal: ${params.goal}
Audience: ${params.audience}
Product/Service: ${params.product || "N/A"}
Tone: ${params.tone}
Language: ${params.language}
Length: ${params.length}
Call to action: ${params.callToAction || "Encourage a reply"}

Respond as JSON: {"variations":[{"label":"A","body":"..."},{"label":"B","body":"..."}, ...]}. Do not include personal data.`;

    const res = await provider.generateText(
      [{ role: "user", content: prompt }],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are a marketing copywriter generating compliant broadcast variations. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "campaign", provider.name, res);
    const parsed = extractJson<{ variations?: MessageVariation[] }>(res.text);
    return parsed?.variations || [];
  });
}

// ===========================================================================
// Message rewriting (spec #76)
// ===========================================================================

export type RewriteMode =
  | "improve"
  | "shorter"
  | "longer"
  | "professional"
  | "friendly"
  | "persuasive"
  | "grammar"
  | "variations";

const REWRITE_INSTRUCTIONS: Record<RewriteMode, string> = {
  improve: "Improve the writing quality, clarity and flow while keeping the meaning.",
  shorter: "Make the message more concise without losing key information.",
  longer: "Expand the message with more detail and context.",
  professional: "Rewrite in a professional, polished tone.",
  friendly: "Rewrite in a warm, friendly tone.",
  persuasive: "Rewrite to be more persuasive and compelling.",
  grammar: "Fix grammar, spelling and punctuation only. Keep the original meaning.",
  variations: "Produce 3 distinct variations of the message.",
};

export async function rewriteMessage(
  organizationId: string,
  userId: string | null,
  text: string,
  mode: RewriteMode,
): Promise<AIOutcome<{ text: string; variations: string[] }>> {
  return run(organizationId, "rewrite", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "rewrite");
    const provider = getProvider(settings.settings.provider);
    const instruction = REWRITE_INSTRUCTIONS[mode];
    const isVariations = mode === "variations";

    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `${instruction}\n\nOriginal:\n${text}\n\n${
            isVariations
              ? 'Respond as JSON: {"variations":["...","...","..."]}'
              : "Respond as JSON: {\"text\":\"...\"}"
          }`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are a copy editor. Preserve personalization tokens like {{first_name}}. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "rewrite", provider.name, res);
    if (isVariations) {
      const parsed = extractJson<{ variations?: string[] }>(res.text);
      return { text: parsed?.variations?.[0] || text, variations: parsed?.variations || [] };
    }
    const parsed = extractJson<{ text?: string }>(res.text);
    return { text: parsed?.text || res.text, variations: [] };
  });
}

// ===========================================================================
// Translation (spec #78)
// ===========================================================================

export async function translateMessage(
  organizationId: string,
  userId: string | null,
  text: string,
  targetLanguage: string,
): Promise<AIOutcome<{ translated: string; language: string }>> {
  return run(organizationId, "translation", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "translation");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.translate(text, targetLanguage, {
      temperature: settings.settings.temperature,
      maxOutput: settings.settings.maxOutput,
    });
    recordUsage(organizationId, userId, "translation", provider.name, res);
    return { translated: res.text.trim(), language: targetLanguage };
  });
}

// ===========================================================================
// Reply suggestion (spec #79)
// ===========================================================================

export type ReplyMode = "default" | "shorter" | "professional" | "translate";

export async function suggestReply(
  organizationId: string,
  userId: string | null,
  context: {
    customerMessage: string;
    conversationHistory?: { from: string; text: string }[];
    product?: string;
    language?: string;
    mode?: ReplyMode;
    targetLanguage?: string;
  },
): Promise<AIOutcome<{ reply: string }>> {
  return run(organizationId, "reply", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "reply");
    const provider = getProvider(settings.settings.provider);
    const history = (context.conversationHistory || [])
      .slice(-6)
      .map((h) => `${h.from}: ${h.text}`)
      .join("\n");

    let instruction = "Draft a helpful, accurate reply to the customer's last message.";
    if (context.mode === "shorter") instruction = "Draft a concise reply.";
    if (context.mode === "professional") instruction = "Draft a professional, polished reply.";
    if (context.mode === "translate") {
      instruction = `Translate the following reply into ${context.targetLanguage || "English"}.`;
    }

    const prompt = `You are assisting a customer-support agent. ${instruction}
Do not invent product facts. Do not make commitments about pricing or delivery unless stated.

${history ? `Conversation so far:\n${history}\n\n` : ""}
Customer's latest message:
${context.customerMessage}

${context.mode === "translate" ? "Reply to translate:" : "Reply:"}`;

    const res = await provider.generateText(
      [{ role: "user", content: prompt }],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        system:
          "You are a customer-support assistant. Be concise and helpful. Never fabricate sensitive customer data.",
      },
    );
    recordUsage(organizationId, userId, "reply", provider.name, res);
    return { reply: res.text.trim() };
  });
}

// ===========================================================================
// Conversation summary (spec #80)
// ===========================================================================

export interface ConversationSummary {
  customer: string;
  summary: string;
  mainQuestion: string;
  currentStatus: string;
  recommendedNextAction: string;
}

export async function summarizeConversation(
  organizationId: string,
  userId: string | null,
  conversation: { contactName?: string; messages: { from: string; text: string }[] },
): Promise<AIOutcome<ConversationSummary>> {
  return run<ConversationSummary>(organizationId, "summary", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "summary");
    const provider = getProvider(settings.settings.provider);
    const transcript = conversation.messages
      .map((m) => `${m.from}: ${m.text}`)
      .join("\n");

    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Summarize this customer conversation.

Customer: ${conversation.contactName || "Unknown"}

Transcript:
${transcript}

Respond as JSON with keys: customer, summary, mainQuestion, currentStatus, recommendedNextAction.`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are a conversation analyst. Do not invent details. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "summary", provider.name, res);
    const parsed = extractJson<ConversationSummary>(res.text);
    if (!parsed) {
      return {
        customer: conversation.contactName || "Unknown",
        summary: res.text,
        mainQuestion: "",
        currentStatus: "",
        recommendedNextAction: "",
      };
    }
    return parsed;
  });
}

// ===========================================================================
// Intent detection (spec #81)
// ===========================================================================

export const INTENT_LABELS = [
  "Sales Inquiry",
  "Support Request",
  "Pricing Question",
  "Complaint",
  "Refund Request",
  "Order Question",
  "General Question",
  "Positive Feedback",
  "Negative Feedback",
  "Spam",
  "Unsubscribe",
  "Other",
] as const;

export async function classifyIntent(
  organizationId: string,
  userId: string | null,
  message: string,
): Promise<AIOutcome<{ intent: string; confidence: number }>> {
  return run(organizationId, "intent", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "intent");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.classify(message, [...INTENT_LABELS], {
      temperature: 0.2,
      maxOutput: settings.settings.maxOutput,
    });
    recordUsage(organizationId, userId, "intent", provider.name, res);
    return { intent: res.label, confidence: res.confidence };
  });
}

// ===========================================================================
// Sentiment (spec #82)
// ===========================================================================

export const SENTIMENT_LABELS = ["Positive", "Neutral", "Negative", "Urgent"] as const;

export async function analyzeSentiment(
  organizationId: string,
  userId: string | null,
  message: string,
): Promise<AIOutcome<{ sentiment: string; confidence: number; priority: string }>> {
  return run(organizationId, "sentiment", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "sentiment");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.classify(message, [...SENTIMENT_LABELS], {
      temperature: 0.2,
      maxOutput: settings.settings.maxOutput,
    });
    recordUsage(organizationId, userId, "sentiment", provider.name, res);
    const priority =
      res.label === "Negative" || res.label === "Urgent" ? "high" : "normal";
    return {
      sentiment: res.label,
      confidence: res.confidence,
      priority,
    };
  });
}

// ===========================================================================
// Campaign optimization analysis (spec #87)
// ===========================================================================

export interface CampaignAnalysis {
  summary: string;
  whatWorked: string[];
  whatCouldImprove: string[];
  audienceResponse: string;
  recommendedNextCampaign: string;
  suggestedMessage: string;
}

export async function generateCampaignAnalysis(
  organizationId: string,
  userId: string | null,
  campaign: {
    name: string;
    channel: string;
    message: string;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    repliedCount: number;
    failedCount: number;
  },
): Promise<AIOutcome<CampaignAnalysis>> {
  return run<CampaignAnalysis>(organizationId, "analysis", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "analysis");
    const provider = getProvider(settings.settings.provider);
    const prompt = `Analyze this completed marketing campaign. Do not present interpretations as guaranteed facts; frame them as observations.

Campaign: ${campaign.name}
Channel: ${campaign.channel}
Message: ${campaign.message}

Metrics:
- Sent: ${campaign.sentCount}
- Delivered: ${campaign.deliveredCount}
- Opened: ${campaign.openedCount}
- Clicked: ${campaign.clickedCount}
- Replied: ${campaign.repliedCount}
- Failed: ${campaign.failedCount}

Respond as JSON with keys: summary (string), whatWorked (string[]), whatCouldImprove (string[]), audienceResponse (string), recommendedNextCampaign (string), suggestedMessage (string).`;

    const res = await provider.generateText(
      [{ role: "user", content: prompt }],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are a marketing analyst. Be honest about uncertainty. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "analysis", provider.name, res);
    const parsed = extractJson<CampaignAnalysis>(res.text);
    if (!parsed) {
      return {
        summary: res.text,
        whatWorked: [],
        whatCouldImprove: [],
        audienceResponse: "",
        recommendedNextCampaign: "",
        suggestedMessage: "",
      };
    }
    return parsed;
  });
}

// ===========================================================================
// Subject lines (spec #89)
// ===========================================================================

export async function generateSubjectLines(
  organizationId: string,
  userId: string | null,
  brief: { topic: string; tone?: string; audience?: string },
): Promise<AIOutcome<{ lines: string[] }>> {
  return run(organizationId, "subject", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "subject");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Generate 5 distinct email subject lines.

Topic: ${brief.topic}
Tone: ${brief.tone || "Engaging"}
Audience: ${brief.audience || "General subscribers"}

Respond as JSON: {"lines":["...","...","...","...","..."]}`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are an email marketing specialist. Avoid spam triggers. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "subject", provider.name, res);
    const parsed = extractJson<{ lines?: string[] }>(res.text);
    return { lines: parsed?.lines || [] };
  });
}

// ===========================================================================
// A/B test generation (spec #88)
// ===========================================================================

export async function generateABTest(
  organizationId: string,
  userId: string | null,
  brief: { goal: string; audience: string; product?: string; channel: string },
): Promise<AIOutcome<{ versions: { label: string; angle: string; body: string }[] }>> {
  return run(organizationId, "abtest", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "abtest");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Create 3 A/B test message versions with distinct angles (e.g. Professional, Friendly, Urgency-focused).

Goal: ${brief.goal}
Audience: ${brief.audience}
Product: ${brief.product || "N/A"}
Channel: ${brief.channel}

Respond as JSON: {"versions":[{"label":"A","angle":"Professional","body":"..."},{"label":"B","angle":"Friendly","body":"..."},{"label":"C","angle":"Urgency-focused","body":"..."}]}`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are a marketing strategist. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "abtest", provider.name, res);
    const parsed = extractJson<{ versions?: { label: string; angle: string; body: string }[] }>(res.text);
    return { versions: parsed?.versions || [] };
  });
}

// ===========================================================================
// Image prompt assistant (spec #90)
// ===========================================================================

export interface ImageConcept {
  headline: string;
  subheadline: string;
  cta: string;
  imageConcept: string;
  designInstructions: string;
}

export async function generateImagePrompt(
  organizationId: string,
  userId: string | null,
  brief: string,
): Promise<AIOutcome<ImageConcept>> {
  return run<ImageConcept>(organizationId, "image_prompt", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "image_prompt");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Create a promotional concept. Do not generate the image itself; produce a concept brief.

Request: ${brief}

Respond as JSON with keys: headline, subheadline, cta, imageConcept, designInstructions.`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are a creative director. Provide concepts only; do not generate images. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "image_prompt", provider.name, res);
    const parsed = extractJson<ImageConcept>(res.text);
    if (!parsed) {
      return {
        headline: res.text,
        subheadline: "",
        cta: "",
        imageConcept: "",
        designInstructions: "",
      };
    }
    return parsed;
  });
}

// ===========================================================================
// Knowledge base Q&A (spec #84, #85)
// ===========================================================================

export async function answerFromKnowledgeBase(
  organizationId: string,
  userId: string | null,
  question: string,
  agentConfig?: { agentName?: string; personality?: string; businessDescription?: string; fallbackMessage?: string },
): Promise<AIOutcome<{ answer: string; sources: { title: string; snippet: string }[]; confident: boolean }>> {
  return run(organizationId, "kb_answer", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "kb_answer");
    const provider = getProvider(settings.settings.provider);

    // Retrieve ONLY relevant chunks (spec #85: do not send entire collection)
    const retrieved = await retrieveRelevant(
      organizationId,
      question,
      4,
      settings.settings.provider,
    );
    const context = retrieved
      .map((r, i) => `[${i + 1}] ${r.documentTitle}\n${r.text}`)
      .join("\n\n");

    const fallback =
      agentConfig?.fallbackMessage ||
      "I'll connect you with a member of our team.";

    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Answer the customer's question using ONLY the provided knowledge base excerpts. If the answer is not contained in the excerpts, respond with exactly: "${fallback}"

Knowledge base:
${context || "(empty)"}

Customer question: ${question}

Respond as JSON: {"answer":"...","confident":true|false}`,
        },
      ],
      {
        temperature: 0.3,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system: `You are ${agentConfig?.agentName || "an AI assistant"} for a customer communications platform. ${
          agentConfig?.personality ? `Personality: ${agentConfig.personality}` : ""
        } ${agentConfig?.businessDescription ? `Business: ${agentConfig.businessDescription}` : ""}
Answer using approved organizational information only. Never fabricate. Respond only with JSON.`,
      },
    );
    recordUsage(organizationId, userId, "kb_answer", provider.name, res);
    const parsed = extractJson<{ answer?: string; confident?: boolean }>(res.text);
    const answer = parsed?.answer || fallback;
    const confident = parsed?.confident !== false && answer !== fallback;
    return {
      answer,
      confident,
      sources: retrieved.map((r) => ({
        title: r.documentTitle,
        snippet: r.text.slice(0, 160),
      })),
    };
  });
}

// ===========================================================================
// Personalization (spec #77)
// ===========================================================================

export async function personalizeMessage(
  organizationId: string,
  userId: string | null,
  template: string,
  contact: { firstName?: string | null; lastName?: string | null; product?: string | null; tags?: string | null },
): Promise<AIOutcome<{ message: string }>> {
  return run(organizationId, "rewrite", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "rewrite");
    const provider = getProvider(settings.settings.provider);

    // Only send explicitly available fields (spec #77, #96)
    const fields: string[] = [];
    if (contact.firstName) fields.push(`first_name: ${contact.firstName}`);
    if (contact.lastName) fields.push(`last_name: ${contact.lastName}`);
    if (contact.product) fields.push(`product: ${contact.product}`);
    if (contact.tags) fields.push(`tags: ${contact.tags}`);

    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Personalize this message using ONLY the provided contact fields. Do not invent any sensitive personal information.

Template:
${template}

Approved contact fields:
${fields.join("\n") || "(none)"}

Respond as JSON: {"message":"..."}`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You personalize marketing messages. Never fabricate personal data. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "rewrite", provider.name, res);
    const parsed = extractJson<{ message?: string }>(res.text);
    // Fallback: simple token replacement
    const fallback = template
      .replace(/{{\s*first_name\s*}}/g, contact.firstName || "")
      .replace(/{{\s*last_name\s*}}/g, contact.lastName || "")
      .replace(/{{\s*product\s*}}/g, contact.product || "");
    return { message: parsed?.message || fallback };
  });
}

// ===========================================================================
// Social media post generation (Facebook / Instagram / TikTok)
// ===========================================================================

export type SocialPlatform = "facebook" | "instagram" | "tiktok";

export interface SocialPostDraft {
  content: string;
  hashtags: string[];
  caption: string; // short hook / first line
  bestTime: string;
}

const PLATFORM_GUIDE: Record<SocialPlatform, string> = {
  facebook: "Facebook: conversational, can be longer (up to ~500 chars), link-friendly, 1-3 emojis, 2-4 relevant hashtags at the end.",
  instagram: "Instagram: visual-first caption, hook in the first line, emoji-friendly, 8-15 relevant hashtags at the end, max ~2200 chars but keep it punchy.",
  tiktok: "TikTok: short punchy caption (under 150 chars), trending-style hashtags (3-6), casual tone, emoji-friendly.",
};

export async function generateSocialPost(
  organizationId: string,
  userId: string | null,
  brief: {
    platform: SocialPlatform;
    topic: string;
    tone?: string;
    product?: string;
    cta?: string;
  },
): Promise<AIOutcome<SocialPostDraft>> {
  return run<SocialPostDraft>(organizationId, "image_prompt", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "image_prompt");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Write a social media post.

Platform: ${brief.platform}
Topic: ${brief.topic}
Tone: ${brief.tone || "Engaging"}
Product/Service: ${brief.product || "N/A"}
Call to action: ${brief.cta || "Encourage engagement"}

Platform guidance: ${PLATFORM_GUIDE[brief.platform]}

Respond as JSON: {"caption":"short hook first line","content":"full post body including caption","hashtags":["tag1","tag2",...],"bestTime":"recommended posting time with reason"}. Do not include the # symbol in hashtags.`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system:
          "You are a social media copywriter. Produce compliant, non-spammy posts optimized for each platform. Never fabricate offers or prices. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "image_prompt", provider.name, res);
    const parsed = extractJson<SocialPostDraft>(res.text);
    if (!parsed) {
      return {
        content: res.text,
        hashtags: [],
        caption: res.text.split("\n")[0] || "",
        bestTime: "Weekday 11am-1pm",
      };
    }
    return {
      content: parsed.content,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      caption: parsed.caption || "",
      bestTime: parsed.bestTime || "Weekday 11am-1pm",
    };
  });
}

// ===========================================================================
// Social post analysis (for the Social hub analytics)
// ===========================================================================

export interface SocialPostAnalysis {
  summary: string;
  topPerformer: string;
  recommendations: string[];
}

export async function analyzeSocialPosts(
  organizationId: string,
  userId: string | null,
  posts: Array<{ platform: string; content: string; likes: number; comments: number; shares: number; views: number }>,
): Promise<AIOutcome<SocialPostAnalysis>> {
  return run<SocialPostAnalysis>(organizationId, "analysis", userId, async () => {
    const settings = await isFeatureEnabled(organizationId, "analysis");
    const provider = getProvider(settings.settings.provider);
    const res = await provider.generateText(
      [
        {
          role: "user",
          content: `Analyze the performance of these social media posts. Frame observations as observations, not guaranteed facts.

${posts.map((p, i) => `Post ${i + 1} [${p.platform}] likes=${p.likes} comments=${p.comments} shares=${p.shares} views=${p.views}
"${p.content.slice(0, 200)}"`).join("\n\n")}

Respond as JSON: {"summary":"...","topPerformer":"which post performed best and why","recommendations":["...","..."]}.`,
        },
      ],
      {
        temperature: settings.settings.temperature,
        maxOutput: settings.settings.maxOutput,
        json: true,
        system: "You are a social media analyst. Respond only with JSON.",
      },
    );
    recordUsage(organizationId, userId, "analysis", provider.name, res);
    const parsed = extractJson<SocialPostAnalysis>(res.text);
    return (
      parsed || {
        summary: res.text,
        topPerformer: "",
        recommendations: [],
      }
    );
  });
}

