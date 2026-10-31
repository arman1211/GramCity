"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function DemoBanner({ className }: { className?: string }) {
  const t = useTranslations("demo");

  return (
    <div
      role="status"
      className={cn(
        "sticky top-0 z-40 border-b border-amber-200/70 bg-amber-50/95 px-4 py-2 text-center text-xs text-amber-950/90 backdrop-blur-sm sm:text-sm",
        className
      )}
    >
      <p className="flex items-center justify-center gap-2 font-medium">
        <Info className="size-4 shrink-0 text-emerald-700" aria-hidden />
        <span>{t("banner")}</span>
      </p>
    </div>
  );
}
