// Seed script — populates the demo BroadcastHub database.
// Run with: bun run db:seed

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Org
  const org = await db.organization.upsert({
    where: { slug: "broadcasthub" },
    update: {},
    create: { name: "BroadcastHub", slug: "broadcasthub" },
  });

  // User
  const user = await db.user.upsert({
    where: { email: "owner@broadcasthub.local" },
    update: {},
    create: {
      email: "owner@broadcasthub.local",
      name: "Sara Ahmed",
      role: "admin",
      organizationId: org.id,
    },
  });
  await db.teamMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: user.id,
      role: "owner",
      department: "marketing",
    },
  });

  const agent2 = await db.user.upsert({
    where: { email: "support@broadcasthub.local" },
    update: {},
    create: {
      email: "support@broadcasthub.local",
      name: "Bilal Khan",
      role: "agent",
      organizationId: org.id,
    },
  });
  await db.teamMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: agent2.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: agent2.id,
      role: "agent",
      department: "support",
    },
  });

  // Contacts
  const contacts = await Promise.all(
    [
      { firstName: "John", lastName: "Smith", email: "john@example.com", phone: "+923001234567", whatsapp: "+923001234567", product: "Premium Plan", tags: "vip,buyer" },
      { firstName: "Aisha", lastName: "Khan", email: "aisha@example.com", phone: "+923211234568", whatsapp: "+923211234568", product: "Starter Plan", tags: "buyer" },
      { firstName: "Li", lastName: "Wei", email: "li@example.com", phone: "+8613800138000", whatsapp: "+8613800138000", product: "Enterprise", tags: "vip,lead" },
      { firstName: "Maria", lastName: "Garcia", email: "maria@example.com", phone: "+34612345678", product: "Pro Plan", tags: "buyer" },
      { firstName: "Hassan", lastName: "Ali", email: "hassan@example.com", phone: "+923331234569", whatsapp: "+923331234569", product: "Starter Plan", tags: "churned" },
      { firstName: "Emma", lastName: "Johnson", email: "emma@example.com", phone: "+447123456789", product: "Premium Plan", tags: "vip,buyer" },
      { firstName: "Omar", lastName: "Farooq", email: "omar@example.com", phone: "+923001234570", product: "", tags: "lead" },
      { firstName: "Sophie", lastName: "Martin", email: "sophie@example.com", phone: "+33123456789", product: "Pro Plan", tags: "buyer" },
    ].map((c) =>
      db.contact.create({
        data: { ...c, organizationId: org.id, status: c.tags.includes("churned") ? "unsubscribed" : "active" },
      }),
    ),
  );

  // Segment
  const vipSegment = await db.segment.create({
    data: {
      organizationId: org.id,
      name: "VIP Customers",
      description: "High-value customers who purchased Premium or Enterprise plans",
      rules: JSON.stringify({ tags: ["vip"] }),
    },
  });
  await Promise.all(
    contacts
      .filter((c) => c.tags.includes("vip"))
      .map((c) =>
        db.segmentMember.create({
          data: { segmentId: vipSegment.id, contactId: c.id },
        }),
      ),
  );

  const buyerSegment = await db.segment.create({
    data: {
      organizationId: org.id,
      name: "Recent Buyers (30 days)",
      description: "Customers who purchased in the last 30 days",
      rules: JSON.stringify({ tags: ["buyer"] }),
    },
  });
  await Promise.all(
    contacts
      .filter((c) => c.tags.includes("buyer"))
      .map((c) =>
        db.segmentMember.create({
          data: { segmentId: buyerSegment.id, contactId: c.id },
        }),
      ),
  );

  // Channels
  await Promise.all(
    [
      { type: "whatsapp", name: "WhatsApp Business", enabled: true },
      { type: "telegram", name: "Telegram Bot", enabled: true },
      { type: "sms", name: "Twilio SMS", enabled: false },
      { type: "email", name: "SMTP Email", enabled: true },
    ].map((ch) =>
      db.channel.create({
        data: { ...ch, organizationId: org.id, config: "{}" },
      }),
    ),
  );

  // Templates
  await Promise.all(
    [
      { name: "Welcome Message", channel: "whatsapp", body: "Hello {{first_name}}, welcome to BroadcastHub! We're excited to have you on board.", category: "onboarding" },
      { name: "Order Ready", channel: "whatsapp", body: "Hi {{first_name}}, your order is ready for pickup. Reply YES to confirm.", category: "transactional" },
      { name: "Summer Sale", channel: "email", body: "Hi {{first_name}}, our summer sale is live! Up to 40% off selected items.", category: "promotional" },
      { name: "Feedback Request", channel: "sms", body: "Hi {{first_name}}, how did we do? Reply 1-5 to rate your experience.", category: "feedback" },
    ].map((t) =>
      db.template.create({ data: { ...t, organizationId: org.id } }),
    ),
  );

  // Campaigns
  const completedCampaign = await db.campaign.create({
    data: {
      organizationId: org.id,
      name: "Summer Launch 2024",
      description: "Promoted the new summer product line to VIP customers",
      channel: "whatsapp",
      status: "completed",
      goal: "Promote new summer product line",
      tone: "Professional but friendly",
      language: "English",
      messageBody: "Hello {{first_name}}, our new summer collection just launched! As a valued customer, you get early access. Reply SUMMER to shop now.",
      callToAction: "Reply SUMMER to shop",
      audienceDescription: "VIP customers who purchased in the last 30 days",
      segmentId: vipSegment.id,
      sentCount: 1240,
      deliveredCount: 1198,
      openedCount: 876,
      clickedCount: 412,
      repliedCount: 156,
      failedCount: 42,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  await db.campaign.create({
    data: {
      organizationId: org.id,
      name: "Ramadan Greetings",
      channel: "whatsapp",
      status: "active",
      goal: "Seasonal greeting",
      tone: "Warm",
      language: "English",
      messageBody: "Ramadan Mubarak {{first_name}}! Wishing you and your family a blessed month.",
      callToAction: "Share the blessing",
      audienceDescription: "All active contacts",
      sentCount: 820,
      deliveredCount: 810,
      openedCount: 0,
      clickedCount: 0,
      repliedCount: 64,
      failedCount: 10,
      startedAt: new Date(),
    },
  });

  await db.campaign.create({
    data: {
      organizationId: org.id,
      name: "Black Friday Email Blast",
      channel: "email",
      status: "draft",
      goal: "Drive sales with Black Friday discounts",
      tone: "Urgent",
      language: "English",
      messageBody: "",
      audienceDescription: "All email subscribers",
    },
  });

  // Conversations with messages
  const john = contacts[0];
  const aisha = contacts[1];
  const hassan = contacts[4];

  const conv1 = await db.conversation.create({
    data: {
      organizationId: org.id,
      contactId: john.id,
      channel: "whatsapp",
      status: "open",
      priority: "high",
      assignedTo: "agent",
    },
  });
  const conv1Messages = [
    { direction: "inbound", body: "Hi, I purchased the Premium Plan last week. Can you tell me more about the new product you mentioned?", senderName: "John Smith" },
    { direction: "outbound", body: "Hi John! Thanks for reaching out. The new product is an AI-powered analytics dashboard included in your Premium plan. Would you like a quick walkthrough?", senderName: "Sara" },
    { direction: "inbound", body: "Yes please. What's the pricing and delivery time for the add-on module?", senderName: "John Smith" },
    { direction: "inbound", body: "I've been waiting for three days and nobody has responded to my pricing question. This is frustrating.", senderName: "John Smith" },
  ];
  for (const m of conv1Messages) {
    await db.conversationMessage.create({
      data: {
        conversationId: conv1.id,
        contactId: john.id,
        direction: m.direction,
        channel: "whatsapp",
        body: m.body,
        senderName: m.senderName,
      },
    });
  }

  const conv2 = await db.conversation.create({
    data: {
      organizationId: org.id,
      contactId: aisha.id,
      channel: "whatsapp",
      status: "open",
      priority: "normal",
    },
  });
  for (const m of [
    { direction: "inbound", body: "Assalam o alaikum, I want to upgrade my plan. What are the options?", senderName: "Aisha Khan" },
    { direction: "outbound", body: "Walaikum assalam Aisha! We have Starter, Pro and Premium plans. The Pro plan is our most popular. Shall I share the details?", senderName: "Sara" },
    { direction: "inbound", body: "Yes, please share Pro plan details and pricing.", senderName: "Aisha Khan" },
  ]) {
    await db.conversationMessage.create({
      data: {
        conversationId: conv2.id,
        contactId: aisha.id,
        direction: m.direction,
        channel: "whatsapp",
        body: m.body,
        senderName: m.senderName,
      },
    });
  }

  const conv3 = await db.conversation.create({
    data: {
      organizationId: org.id,
      contactId: hassan.id,
      channel: "sms",
      status: "pending",
      priority: "urgent",
    },
  });
  await db.conversationMessage.create({
    data: {
      conversationId: conv3.id,
      contactId: hassan.id,
      direction: "inbound",
      channel: "sms",
      body: "I want to unsubscribe from all messages immediately.",
      senderName: "Hassan Ali",
    },
  });

  // Automations (spec #83, #86)
  await db.automation.create({
    data: {
      organizationId: org.id,
      name: "Route Sales Inquiries",
      description: "Assign sales-intent conversations to the Sales team",
      trigger: "new_reply",
      conditions: JSON.stringify([{ field: "intent", op: "equals", value: "Sales Inquiry" }]),
      actions: JSON.stringify([{ type: "assign_department", value: "sales" }, { type: "suggest_reply" }]),
      useAi: true,
      enabled: true,
    },
  });
  await db.automation.create({
    data: {
      organizationId: org.id,
      name: "Escalate Negative Sentiment",
      description: "Mark high-priority and notify manager for negative messages",
      trigger: "sentiment_negative",
      conditions: JSON.stringify([{ field: "sentiment", op: "equals", value: "Negative" }]),
      actions: JSON.stringify([{ type: "set_priority", value: "high" }, { type: "notify_manager" }]),
      useAi: true,
      enabled: true,
    },
  });
  await db.automation.create({
    data: {
      organizationId: org.id,
      name: "Honor Unsubscribe (Deterministic)",
      description: "Unsubscribe requests are always honored via deterministic rules, not AI alone",
      trigger: "new_reply",
      conditions: JSON.stringify([{ field: "intent", op: "equals", value: "Unsubscribe" }, { field: "text_contains", op: "regex", value: "unsubscribe|stop|opt out" }]),
      actions: JSON.stringify([{ type: "add_suppression" }, { type: "set_status", value: "unsubscribed" }]),
      useAi: false,
      enabled: true,
    },
  });

  // Notifications
  await db.notification.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      type: "urgent_conversation",
      title: "Urgent conversation needs attention",
      body: "John Smith sent a frustrated message about pricing (3 days waiting).",
    },
  });
  await db.notification.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      type: "campaign_completed",
      title: "Summer Launch 2024 completed",
      body: "1240 sent, 156 replies. View the AI analysis.",
    },
  });

  // Webhooks
  await db.webhook.create({
    data: {
      organizationId: org.id,
      name: "CRM Sync",
      url: "https://hooks.example.com/crm",
      events: JSON.stringify(["conversation.created", "campaign.completed"]),
      enabled: true,
    },
  });

  // API key (hashed placeholder)
  await db.apiKey.create({
    data: {
      organizationId: org.id,
      label: "Production",
      keyPrefix: "bch_live_",
      hashedKey: "demo-placeholder-hash",
    },
  });

  // AI settings — enabled by default in demo so features work out of the box.
  await db.aISetting.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      enabled: true,
      provider: process.env.OPENAI_API_KEY ? "openai" : "demo",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      // Demo: all features enabled so the platform is fully explorable.
      // In production, customerSupport stays off until an admin opts in (spec #97).
      customerSupport: true,
    },
  });

  await db.aICustomerSupportAgent.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      agentName: "Aria",
      personality: "Helpful, friendly and concise.",
      language: "English",
      businessDescription:
        "BroadcastHub is an omnichannel communication platform offering WhatsApp, Telegram, SMS and Email broadcasting with AI assistance.",
      workingHours: "09:00-18:00",
      enabled: true,
    },
  });

  // Knowledge base sample docs
  const kb1 = await db.kBDocument.create({
    data: {
      organizationId: org.id,
      title: "Pricing FAQ",
      sourceType: "faq",
      content: `Pricing FAQ

Q: What plans do you offer?
A: BroadcastHub offers three plans: Starter ($19/mo, up to 1,000 contacts), Pro ($49/mo, up to 10,000 contacts, all channels), and Premium ($99/mo, unlimited contacts, priority support, AI features).

Q: Is there a free trial?
A: Yes, all plans include a 14-day free trial. No credit card required.

Q: Do you offer refunds?
A: We offer a 30-day money-back guarantee on all annual plans. Monthly plans are refundable within 7 days.

Q: Can I switch plans?
A: Yes, you can upgrade or downgrade at any time. Changes are prorated automatically.

Q: Are there setup fees?
A: No setup fees. You only pay the monthly subscription.`,
      status: "ready",
    },
  });
  const kb2 = await db.kBDocument.create({
    data: {
      organizationId: org.id,
      title: "Product Catalog",
      sourceType: "txt",
      content: `BroadcastHub Product Catalog

1. WhatsApp Business API Integration
   - Official Meta Business API
   - Template message approval
   - Session messaging
   - Delivery receipts

2. Telegram Bot Integration
   - Official Bot API
   - Inline keyboards
   - Channel broadcasting
   - Group support

3. SMS via Twilio
   - Global reach
   - Two-way messaging
   - Short codes

4. Email (SMTP)
   - Custom templates
   - DKIM/SPF configured
   - Open/click tracking

5. AI Assistant Module
   - Campaign generation
   - Reply suggestions
   - Translation (8 languages)
   - Intent & sentiment detection
   - Knowledge base Q&A

6. Analytics Dashboard
   - Delivery rates
   - Response tracking
   - A/B test results
   - Exportable reports`,
      status: "ready",
    },
  });
  const kb3 = await db.kBDocument.create({
    data: {
      organizationId: org.id,
      title: "Delivery & Shipping Policy",
      sourceType: "docx",
      content: `Delivery and Shipping Policy

Digital products (subscriptions, AI add-ons):
- Activated instantly upon payment confirmation.
- Access details sent via email within 5 minutes.

Physical products (hardware kits):
- Standard delivery: 5-7 business days.
- Express delivery: 2-3 business days (additional $15).
- International shipping available to 40+ countries.

Order tracking:
- A tracking link is sent via WhatsApp and email once the order ships.
- Customers can also track via the customer portal.

Delays:
- If an order is delayed beyond the estimated window, customers receive a 10% credit on their next purchase.`,
      status: "ready",
    },
  });

  // Index KB docs (creates chunks + embeddings)
  console.log("Seeding complete. Indexing KB docs...");
  const { indexDocument } = await import("../src/lib/ai/embeddings");
  await indexDocument(org.id, kb1.id, kb1.content);
  await indexDocument(org.id, kb2.id, kb2.content);
  await indexDocument(org.id, kb3.id, kb3.content);

  console.log(`Seeded ${contacts.length} contacts, 3 campaigns, 3 conversations, 3 KB docs.`);
  console.log(`Completed campaign id: ${completedCampaign.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
