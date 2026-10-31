import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import type { Locale, LocalizedString } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Bangla digits ০-৯ → ASCII 0-9 */
export function normalizeDigits(input: string): string {
  const map: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };
  return input.replace(/[০-৯]/g, (d) => map[d] ?? d);
}

/** Accept local 01XXXXXXXXX or +8801XXXXXXXXX */
export function normalizePhone(input: string): string {
  let p = normalizeDigits(input).replace(/[\s\-()]/g, "");
  if (p.startsWith("880") && p.length === 13) p = `+${p}`;
  if (p.startsWith("01") && p.length === 11) p = `+880${p.slice(1)}`;
  if (p.startsWith("+8801") && p.length === 14) return p;
  return p;
}

export function isValidBdPhone(input: string): boolean {
  const p = normalizePhone(input);
  return /^\+8801[3-9]\d{8}$/.test(p);
}

export function maskPhone(phone: string): string {
  const p = normalizePhone(phone);
  if (p.length < 8) return p;
  return `${p.slice(0, 6)}****${p.slice(-2)}`;
}

export function formatBdt(minorUnits: number, locale: Locale = "bn"): string {
  const major = minorUnits / 100;
  const formatted = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(major);
  return formatted;
}

export function formatDateTime(iso: string, locale: Locale = "bn"): string {
  try {
    return formatInTimeZone(
      new Date(iso),
      "Asia/Dhaka",
      locale === "bn" ? "d MMM yyyy, h:mm a" : "d MMM yyyy, h:mm a",
      { locale: undefined }
    );
  } catch {
    return iso;
  }
}

export function formatDate(iso: string, _locale: Locale = "bn"): string {
  try {
    return formatInTimeZone(new Date(iso), "Asia/Dhaka", "d MMM yyyy");
  } catch {
    return iso;
  }
}

export function tLocal(str: LocalizedString, locale: Locale): string {
  return str[locale] || str.en || str.bn;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
