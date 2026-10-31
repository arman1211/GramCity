import type { DemoStore } from "@/lib/types";
import { createSeedStore } from "@/lib/mock/seed";

export const DEMO_STORE_KEY = "gramcity_demo_v1";
export const DEMO_STORE_VERSION = 1;

let memoryCache: DemoStore | null = null;

function loadFromStorage(): DemoStore | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(DEMO_STORE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as DemoStore;
    if (parsed.version !== DEMO_STORE_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persist(store: DemoStore): void {
  memoryCache = store;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
  }
}

/** Load demo state from localStorage or seed; reseed when version mismatches. */
export function getStore(): DemoStore {
  if (memoryCache && memoryCache.version === DEMO_STORE_VERSION) {
    return memoryCache;
  }

  const stored = loadFromStorage();
  if (stored) {
    memoryCache = stored;
    return memoryCache;
  }

  const seeded = createSeedStore();
  persist(seeded);
  return seeded;
}

export function saveStore(store: DemoStore): void {
  persist({ ...store, version: DEMO_STORE_VERSION });
}

/** Reseed demo data and clear the signed-in user. */
export function resetStore(): DemoStore {
  const seeded = createSeedStore();
  seeded.currentUserId = null;
  persist(seeded);
  return seeded;
}
