// /api/ai/run — central dispatcher for all OpenAIService operations (spec #93).
//
// Body: { feature: string, ...params }
// Every call is org-scoped, feature-gated, logged, and gracefully degrades.

import { NextResponse } from "next/server";
import { resolveContext } from "@/lib/org-context";
import * as service from "@/lib/ai/service";

export async function POST(req: Request) {
  const { organizationId, userId } = await resolveContext();
  const body = await req.json().catch(() => ({}));
  const feature: string = body.feature;

  switch (feature) {
    case "campaign":
      return NextResponse.json(
        await service.generateCampaign(organizationId, userId, {
          description: body.description || "",
          goal: body.goal,
          tone: body.tone,
          language: body.language,
          channel: body.channel,
          product: body.product,
        }),
      );

    case "variations":
      return NextResponse.json(
        await service.generateVariations(organizationId, userId, {
          goal: body.goal || "",
          audience: body.audience || "",
          product: body.product,
          tone: body.tone || "Professional",
          language: body.language || "English",
          length: body.length || "Medium",
          callToAction: body.callToAction,
          count: body.count,
        }),
      );

    case "rewrite":
      return NextResponse.json(
        await service.rewriteMessage(
          organizationId,
          userId,
          body.text || "",
          body.mode || "improve",
        ),
      );

    case "translate":
      return NextResponse.json(
        await service.translateMessage(
          organizationId,
          userId,
          body.text || "",
          body.targetLanguage || "English",
        ),
      );

    case "reply":
      return NextResponse.json(
        await service.suggestReply(organizationId, userId, {
          customerMessage: body.customerMessage || "",
          conversationHistory: body.conversationHistory || [],
          product: body.product,
          language: body.language,
          mode: body.mode || "default",
          targetLanguage: body.targetLanguage,
        }),
      );

    case "summary":
      return NextResponse.json(
        await service.summarizeConversation(organizationId, userId, {
          contactName: body.contactName,
          messages: body.messages || [],
        }),
      );

    case "intent":
      return NextResponse.json(
        await service.classifyIntent(organizationId, userId, body.message || ""),
      );

    case "sentiment":
      return NextResponse.json(
        await service.analyzeSentiment(organizationId, userId, body.message || ""),
      );

    case "analysis":
      return NextResponse.json(
        await service.generateCampaignAnalysis(organizationId, userId, {
          name: body.name || "",
          channel: body.channel || "",
          message: body.message || "",
          sentCount: Number(body.sentCount) || 0,
          deliveredCount: Number(body.deliveredCount) || 0,
          openedCount: Number(body.openedCount) || 0,
          clickedCount: Number(body.clickedCount) || 0,
          repliedCount: Number(body.repliedCount) || 0,
          failedCount: Number(body.failedCount) || 0,
        }),
      );

    case "subject":
      return NextResponse.json(
        await service.generateSubjectLines(organizationId, userId, {
          topic: body.topic || "",
          tone: body.tone,
          audience: body.audience,
        }),
      );

    case "abtest":
      return NextResponse.json(
        await service.generateABTest(organizationId, userId, {
          goal: body.goal || "",
          audience: body.audience || "",
          product: body.product,
          channel: body.channel || "email",
        }),
      );

    case "image_prompt":
      return NextResponse.json(
        await service.generateImagePrompt(organizationId, userId, body.brief || ""),
      );

    case "kb_answer":
      return NextResponse.json(
        await service.answerFromKnowledgeBase(organizationId, userId, body.question || "", {
          agentName: body.agentName,
          personality: body.personality,
          businessDescription: body.businessDescription,
          fallbackMessage: body.fallbackMessage,
        }),
      );

    case "personalize":
      return NextResponse.json(
        await service.personalizeMessage(organizationId, userId, body.template || "", {
          firstName: body.firstName,
          lastName: body.lastName,
          product: body.product,
          tags: body.tags,
        }),
      );

    default:
      return NextResponse.json(
        { ok: false, error: `Unknown AI feature: ${feature}` },
        { status: 400 },
      );
  }
}
