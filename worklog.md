---
Task ID: 8-a
Agent: full-stack-developer
Task: Build system section components

Work Log:
- Read existing project context: page.tsx section router, useDashboardData hook, app-store section IDs, section-helpers (SectionHeader / StatCard / EmptyState / LoadingGrid / ChannelBadge / StatusBadge / PriorityBadge / FieldRow), and ai-assistant.tsx as a style reference. Confirmed emerald brand + violet AI accent (`bg-ai`, `text-ai`) and confirmed recharts 2.15 is installed.
- Created `/src/components/sections/notifications.tsx` — NotificationsSection: list with type icons (info/warning/success/message/campaign), unread dot + badge count, relative time via date-fns `formatDistanceToNow`, mark-read / mark-all-read / dismiss actions with local state + sonner toasts, EmptyState + LoadingGrid.
- Created `/src/components/sections/reports.tsx` — ReportsSection: 4 StatCards (total sent, delivery rate, reply rate, active campaigns) using data.metrics; recharts BarChart of top 8 campaigns by replies; channel breakdown card grouping campaigns by channel with reply rate; full campaign performance table (sent/delivered/opened/clicked/replied). Fixed a react-hooks/rules-of-hooks violation by moving `useMemo` above the early returns and reading campaigns via `data?.campaigns ?? []`.
- Created `/src/components/sections/api.tsx` — ApiSection: API keys table (label, key prefix, created date, last used, status), Create Key dialog (UI-only, generates a fake `bh_live_xxxx` prefix + reveals a one-time secret with copy-to-clipboard), revoke action, server-side hashing note (amber callout), curl quick-start code sample with copy button.
- Created `/src/components/sections/webhooks.tsx` — WebhooksSection: endpoint cards with name, URL (copy button), events parsed from JSON-string field into badges, enable/disable Switch with toast, "Add Endpoint" + "Edit" buttons as UI placeholders, endpoint configuration reference card (URL / signing / retries / response).
- Created `/src/components/sections/team.tsx` — TeamSection: 3 StatCards (members, departments, admins/owners), members table with avatar + initials, role badges (owner/admin/agent/viewer) with icons, department badges with per-department color mapping, mailto email links, invite button (UI placeholder toast).
- Created `/src/components/sections/settings.tsx` — SettingsSection: General card (app name default "BroadcastHub", company name, support email, footer text via FieldRow + Input/Textarea), Preferences card (compact density, RTL, show delivery metrics, weekly digest via Switch), white-label note card, AI Settings link card calling `setSection("ai-settings")`, local state with save/reset toasts.
- Created `/src/components/sections/admin.tsx` — AdminSection: organization card (name/slug/current user/plan), 4 StatCards (contacts/campaigns/conversations/team), data-totals grid covering all 9 entity counts, AI Settings link card calling `setSection("ai-settings")`, danger zone with data retention note and "Reset demo data" button using AlertDialog confirmation (UI-only, refreshes from API).
- Ran `bun run lint` — initial pass surfaced one react-hooks/rules-of-hooks error in reports.tsx; restructured to compute `channelBreakdown` via `useMemo` before the loading/no-data early returns. Final `bun run lint` passes with zero errors.

Stage Summary:
- All 7 section components created at the exact paths required by `src/app/page.tsx`: notifications, reports, api, webhooks, team, settings, admin.
- Each section is `"use client"`, wraps content in `container mx-auto`, uses `SectionHeader` at top, handles loading via `LoadingGrid` and empty state via `EmptyState`.
- Reuses shared `@/components/bh/section-helpers` (SectionHeader, StatCard, EmptyState, LoadingGrid, ChannelBadge, StatusBadge, FieldRow) and shadcn/ui (card, button, table, badge, input, textarea, switch, dialog, alert-dialog, avatar) — no new shadcn components added.
- Uses recharts `BarChart` for the reports engagement leaderboard, emerald primary + violet `bg-ai`/`text-ai` accents only (no indigo/blue), responsive mobile-first layouts, semantic HTML, aria-labels on icon-only buttons.
- Lint is clean. Remaining `dev.log` "Module not found" warnings are for OTHER section files (dashboard, contacts, segments, campaigns, correspondence, automations, templates, channels, ai-* sub-sections) owned by other task IDs — not in scope for 8-a.

---
Task ID: main
Agent: Z.ai Code (orchestrator)
Task: OpenAI AI integration throughout BroadcastHub (spec items 72-103)

Work Log:
- Designed Prisma schema with Organization, Contact, Campaign, Conversation, Template, Channel, Automation, Notification, TeamMember, Webhook, ApiKey + full AI layer (AIRequest, AISetting, AICustomerSupportAgent, KBDocument, KBChunk, MessageIntent)
- Built AI provider abstraction: AIProvider interface (spec #92) + OpenAIProvider (official `openai` SDK, server-side key) + DemoProvider (z-ai-web-dev-sdk fallback for when OPENAI_API_KEY is absent)
- Built OpenAIService (spec #93) with: generateCampaign, generateVariations, rewriteMessage, translateMessage, suggestReply, summarizeConversation, classifyIntent, analyzeSentiment, generateCampaignAnalysis, generateSubjectLines, generateABTest, generateImagePrompt, answerFromKnowledgeBase, personalizeMessage
- Built embeddings + semantic retrieval pipeline (chunk → embed → vector store → cosine retrieval) for Knowledge Base (spec #85)
- Built AI logging (spec #95) with org-scoped AIRequest records, feature gating, retention pruning
- Built AI API routes: /api/ai/{status,settings,agent,usage,logs,kb,kb/[id],kb/ask,run} + /api/data + /api/conversations/[id]/{messages,classify,summary}
- All AI routes are org-scoped (spec #96), feature-gated, logged, and gracefully degrade
- Deterministic safety: unsubscribe honored via regex keyword match + intent, never AI alone (spec #83, #98)
- Built app shell: sidebar with all sections (spec #73), header, theme provider, Zustand store, sticky footer, AI status pill
- Built 30 section components: Dashboard, Contacts, Segments, Campaigns, Correspondence, Automations, Templates, Channels + 16 AI sections + 7 system sections
- AI sections: Assistant hub, Campaign Writer, Message Generator, Reply Assistant, Conversation Summary, Translator, Classifier, Automation, Knowledge Base, Customer Support, Campaign Optimization, A/B Test, Subject Lines, Image Prompt, Settings, Usage
- Consistent ✨ AI UI: AiButton, AiBadge, AiResultCard, NotConfiguredBanner (spec #99)
- Seeded demo data: org, 8 contacts, 2 segments, 3 campaigns (1 completed), 3 conversations, 3 KB docs (indexed), 3 automations, notifications, team, webhooks
- .env.example with OPENAI_API_KEY, OPENAI_MODEL, OPENAI_EMBEDDING_MODEL (spec #101)

Stage Summary:
- Verified end-to-end with Agent Browser:
  * Dashboard renders with metrics + AI quick actions ✅
  * AI Campaign Writer generates full drafts (name/message/CTA/audience/timing) ✅
  * Knowledge Base Q&A returns grounded answers with retrieved sources ✅
  * Correspondence: AI reply suggestion + intent/sentiment classify + deterministic unsubscribe honored ✅
  * AI Usage logs all requests with input/output tokens + 14-day trend chart ✅
  * AI Settings: provider/model/temperature/feature toggles/privacy/human-approval config ✅
  * Graceful fallback: disabling AI shows "AI features are not configured" banner, no crash (spec #102) ✅
  * Mobile responsive with working sidebar toggle ✅
  * Sticky footer (pushed down on long pages) ✅
  * Lint passes clean, no console/runtime errors ✅
- AI runs in Demo Mode (z-ai-web-dev-sdk) since no OPENAI_API_KEY configured; swaps to real OpenAI automatically when key is present. Both implement the same AIProvider interface.

---
Task ID: social
Agent: Z.ai Code (orchestrator)
Task: Add social media integration (Facebook, Instagram, TikTok) to BroadcastHub

Work Log:
- Added SocialPost model to Prisma schema (platform, content, hashtags, link, status, scheduledAt, publishedAt, metrics: likes/comments/shares/views/reach, aiGenerated); added socialPosts relation to Organization; db push + regenerate
- Extended Channel type enum to include facebook | instagram | tiktok
- Updated ChannelBadge component with brand colors for the 3 new platforms
- Rewrote Channels section: split into Messaging + Social Media groups, rich channel cards with capabilities list, OAuth-style Connect Account dialog for social platforms, "Open Social Media" CTA banner when social is connected
- Added generateSocialPost + analyzeSocialPosts to OpenAIService with platform-specific guidance (FB: 500 chars link-friendly; IG: 2200 chars hashtag-heavy; TikTok: 150 chars trending hashtags)
- Wired social_post + social_analysis features into /api/ai/run dispatcher
- Built /api/social/posts (GET list, POST create with draft/schedule/publish actions) and /api/social/posts/[id] (PATCH publish/update, DELETE) — all org-scoped
- Updated /api/data to include socialPosts[] + social metrics (socialChannelsConnected, socialPostsPublished, socialReach)
- Updated useDashboardData hook types with socialPosts + new metrics
- Added "social" SectionId, "Social Media" sidebar nav item (Share2 icon), section title, page router entry
- Built the Social Media section component: stats row (platforms/published/reach/scheduled), Composer (platform selector with brand colors, AI Post Generator panel, content editor with per-platform char limit + tip, hashtags, link, schedule, save draft/schedule/publish), Post Feed (filterable tabs All/Published/Scheduled/Drafts, per-post metrics display, publish-now + delete actions)
- Updated seed: 3 social channels enabled, 5 sample posts (3 published with realistic metrics, 1 scheduled, 1 draft), 2 social DM conversations (Facebook Messenger + Instagram DM) routed into Correspondence
- Reset DB and re-seeded

Stage Summary:
- Verified end-to-end with Agent Browser:
  * Channels section shows Messaging + Social Media groups with FB/IG/TikTok cards, capabilities, Connect Account dialogs ✅
  * Social Media section: 3 platforms connected, 3 posts published, 134,400 reach, 1 scheduled ✅
  * AI Post Generator: generated a polished Facebook post about the AI analytics dashboard + hashtags (MarketingAI, Analytics, DataDrivenMarketing, MarketingTech) ✅
  * Post feed: shows all 5 posts with platform badges, statuses, hashtags, and metrics (TikTok: 142,000 views / 4,210 likes / 890 shares) ✅
  * Publish flow: clicking "Publish Now" on a draft updated the published count from 3 → 4 ✅
  * Correspondence: Instagram + Facebook DMs routed in alongside WhatsApp/SMS, with correct channel badges ✅
  * Lint clean, no console/runtime errors ✅
- Social DMs and comments flow into the same Correspondence queue as WhatsApp/Telegram/SMS/Email, so AI reply suggestions, intent detection, sentiment, and routing all apply to social conversations too.
