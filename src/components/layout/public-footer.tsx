"use client";

import { useTranslations } from "next-intl";

import { LogoMark } from "@/components/brand/logo-mark";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const policyLinks = [
  { href: "/policies/terms", key: "terms" as const },
  { href: "/policies/privacy", key: "privacy" as const },
  { href: "/policies/community", key: "community" as const },
] as const;

export function PublicFooter({ className }: { className?: string }) {
  const tNav = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const tPolicies = useTranslations("policies");
  const tDemo = useTranslations("demo");

  return (
    <footer
      className={cn(
        "border-t border-border bg-slate-50/80 text-sm text-slate-600",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <LogoMark size="sm" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {tBrand("tagline")}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-800">
              {tNav("explore")}
            </p>
            <Link
              href="/explore"
              className="block min-h-10 py-1.5 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("explore")}
            </Link>
            <Link
              href="/pricing"
              className="block min-h-10 py-1.5 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("pricing")}
            </Link>
            <Link
              href="/how-it-works"
              className="block min-h-10 py-1.5 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("howItWorks")}
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-800">
              {tNav("support")}
            </p>
            <Link
              href="/faq"
              className="block min-h-10 py-1.5 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("faq")}
            </Link>
            <Link
              href="/safety"
              className="block min-h-10 py-1.5 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("safety")}
            </Link>
            <Link
              href="/support"
              className="block min-h-10 py-1.5 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("support")}
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-800">
              {tPolicies("terms")}
            </p>
            {policyLinks.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className="block min-h-10 py-1.5 underline-offset-4 hover:text-emerald-700 hover:underline"
              >
                {tPolicies(key)}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3 border-t border-border pt-6">
          <p className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-950/90">
            {tDemo("banner")}
          </p>
          <p className="text-xs text-muted-foreground">
            {tPolicies("draftNotice")}
          </p>
        </div>
      </div>
    </footer>
  );
}
