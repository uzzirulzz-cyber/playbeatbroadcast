"use client";

import { useCallback, useEffect, useState } from "react";

interface AdminSession {
  authenticated: boolean;
  configured: boolean;
  loading: boolean;
}

export function useAdminSession() {
  const [state, setState] = useState<AdminSession>({
    authenticated: false,
    configured: true,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session");
      const data = await res.json();
      setState({
        authenticated: Boolean(data.authenticated),
        configured: Boolean(data.configured),
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  return { ...state, refresh };
}
