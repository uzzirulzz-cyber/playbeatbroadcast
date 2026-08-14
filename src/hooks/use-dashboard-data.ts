"use client";

// Fetches all dashboard data in one pageload.

import { useEffect, useState } from "react";

export interface DashboardData {
  organization: { id: string; name: string; slug: string } | null;
  currentUser: { id: string | null };
  contacts: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    product: string | null;
    tags: string;
    status: string;
    notes: string | null;
    createdAt: string;
  }>;
  segments: Array<{
    id: string;
    name: string;
    description: string | null;
    rules: string;
    memberCount: number;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    description: string | null;
    channel: string;
    status: string;
    goal: string | null;
    tone: string | null;
    language: string;
    messageBody: string | null;
    callToAction: string | null;
    audienceDescription: string | null;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    repliedCount: number;
    failedCount: number;
    startedAt: string | null;
    completedAt: string | null;
    analysis: string | null;
    createdAt: string;
  }>;
  conversations: Array<{
    id: string;
    channel: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    summary: string | null;
    contactName: string;
    contactEmail: string | null;
    contactId: string | null;
    updatedAt: string;
    messages: Array<{
      id: string;
      direction: string;
      body: string;
      senderName: string | null;
      channel: string;
      aiSuggested: boolean;
      approvedByHuman: boolean;
      createdAt: string;
    }>;
  }>;
  templates: Array<{
    id: string;
    name: string;
    channel: string;
    body: string;
    category: string | null;
  }>;
  channels: Array<{
    id: string;
    type: string;
    name: string;
    enabled: boolean;
  }>;
  automations: Array<{
    id: string;
    name: string;
    description: string | null;
    trigger: string;
    conditions: string;
    actions: string;
    useAi: boolean;
    enabled: boolean;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
  }>;
  team: Array<{
    id: string;
    role: string;
    department: string | null;
    name: string | null;
    email: string;
  }>;
  webhooks: Array<{
    id: string;
    name: string;
    url: string;
    events: string;
    enabled: boolean;
  }>;
  apiKeys: Array<{
    id: string;
    label: string;
    keyPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
    revoked: boolean;
  }>;
  socialPosts: Array<{
    id: string;
    platform: string;
    content: string;
    hashtags: string;
    link: string | null;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach: number;
    aiGenerated: boolean;
    error: string | null;
    createdAt: string;
  }>;
  metrics: {
    totalContacts: number;
    activeContacts: number;
    totalCampaigns: number;
    activeCampaigns: number;
    openConversations: number;
    totalSent: number;
    totalReplies: number;
    deliveryRate: number;
    replyRate: number;
    socialChannelsConnected: number;
    socialPostsPublished: number;
    socialReach: number;
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/data");
      const json = (await res.json()) as DashboardData;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { data, loading, error, refresh };
}
