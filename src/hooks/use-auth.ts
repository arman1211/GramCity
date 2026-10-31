"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api";
import type { User } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user: user ?? null,
    loading: user === undefined,
    refresh,
  };
}
