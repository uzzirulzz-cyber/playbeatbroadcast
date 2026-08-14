"use client";

// Client-side hooks for calling the AI API. All calls go through /api/ai/run
// (server-side) so the OpenAI key is never exposed to the browser.

import { useCallback, useEffect, useState } from "react";

export interface AIStatus {
  aiEnabled: boolean;
  orgEnabled: boolean;
  provider: string;
  available: boolean;
  model: string;
  embeddingModel: string;
  reason?: string;
  isDemo: boolean;
  openAIConfigured: boolean;
  features: {
    replySuggestions: boolean;
    summaries: boolean;
    translation: boolean;
    classification: boolean;
    customerSupport: boolean;
    campaignGeneration: boolean;
  };
}

export function useAIStatus() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, refresh };
}

export interface AIRunResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  disabled?: boolean;
  provider?: string;
  latencyMs?: number;
}

/** Call the /api/ai/run dispatcher. */
export function useAIRun() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(feature: string, params: Record<string, unknown>): Promise<AIRunResult<T>> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, ...params }),
      });
      const data = (await res.json()) as AIRunResult<T>;
      if (!data.ok && !data.disabled) {
        setError(data.error || "AI request failed");
      }
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error };
}
