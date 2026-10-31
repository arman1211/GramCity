"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/explore", key: "explore" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/how-it-works", key: "howItWorks" as const },
  { href: "/safety", key: "safety" as const },
  { href: "/faq", key: "faq" as const },
] as const;

export function PublicHeader() {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16">
        <Link
          href="/"
          className="min-w-0 shrink leading-tight text-slate-900"
        >
          <span className="block text-base font-semibold sm:text-lg">
            <span>GramCity Express</span>
            <span className="mx-1 hidden font-normal text-muted-foreground sm:inline">
              /
            </span>
            <span className="block text-emerald-800 sm:inline">গ্রামসিটি এক্সপ্রেস</span>
          </span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:block">
            {tBrand("tagline")}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label={t("home")}
        >
          {publicLinks.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-accent hover:text-emerald-800",
                pathname === href && "bg-accent text-emerald-800"
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/sign-in">{t("signIn")}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="left-0 top-0 flex h-full max-w-xs translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-r p-0 sm:max-w-xs">
          <DialogHeader className="border-b border-border px-4 py-4 text-left">
            <DialogTitle className="text-base">{tBrand("name")}</DialogTitle>
          </DialogHeader>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {publicLinks.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "min-h-11 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-accent",
                  pathname === href && "bg-accent text-emerald-800"
                )}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-border p-4">
            <LanguageSwitcher className="w-full justify-center" />
            <Button asChild className="w-full">
              <Link href="/auth/sign-in" onClick={() => setMenuOpen(false)}>
                {t("signIn")}
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
