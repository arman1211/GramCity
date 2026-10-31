"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const policyLinks = [
  { href: "/policies/terms", key: "terms" as const },
  { href: "/policies/privacy", key: "privacy" as const },
  { href: "/policies/community", key: "community" as const },
] as const;

export function PublicFooter({ className }: { className?: string }) {
  const tNav = useTranslations("nav");
  const tPolicies = useTranslations("policies");
  const tDemo = useTranslations("demo");

  return (
    <footer
      className={cn(
        "border-t border-border bg-card text-sm text-slate-600",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="font-medium text-slate-800">{tNav("support")}</p>
            <Link
              href="/support"
              className="block min-h-11 py-1 text-slate-600 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("support")}
            </Link>
            <Link
              href="/faq"
              className="block min-h-11 py-1 text-slate-600 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              {tNav("faq")}
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-slate-800">{tPolicies("terms")}</p>
            <ul className="space-y-1">
              {policyLinks.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center py-1 underline-offset-4 hover:text-emerald-700 hover:underline"
                  >
                    {tPolicies(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-6 rounded-md border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-900/90">
          {tDemo("banner")}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {tPolicies("draftNotice")}
        </p>
      </div>
    </footer>
  );
}
