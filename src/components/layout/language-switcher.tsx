"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  const nextLocale: AppLocale = locale === "bn" ? "en" : "bn";

  function toggleLocale() {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      className={cn(
        "h-9 gap-1.5 border-border bg-background px-2.5 text-xs font-semibold text-slate-700",
        className
      )}
      aria-label={`${t("language")}: ${nextLocale === "bn" ? "বাংলা" : "English"}`}
    >
      <Languages className="size-3.5 shrink-0 text-emerald-700" aria-hidden />
      <span className="uppercase tracking-wide">{locale}</span>
      <span className="text-muted-foreground" aria-hidden>
        /
      </span>
      <span className="uppercase tracking-wide text-muted-foreground">
        {nextLocale}
      </span>
    </Button>
  );
}
