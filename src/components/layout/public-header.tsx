"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/brand/logo-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, usePathname } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/api";
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
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    void getCurrentUser()
      .then((u) => setSignedIn(Boolean(u)))
      .catch(() => setSignedIn(false));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16">
        <Link
          href="/"
          className="min-w-0 shrink rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark />
        </Link>

        <nav
          className="hidden items-center gap-0.5 lg:flex"
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
          {signedIn ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/sign-in">{t("signIn")}</Link>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
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
            <DialogTitle className="sr-only">{tBrand("name")}</DialogTitle>
            <LogoMark size="sm" />
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
              <Link
                href={signedIn ? "/dashboard" : "/auth/sign-in"}
                onClick={() => setMenuOpen(false)}
              >
                {signedIn ? t("dashboard") : t("signIn")}
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
