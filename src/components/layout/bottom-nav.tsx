"use client";

import {
  Compass,
  Home,
  Package,
  Route,
  User,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  labelKey: "home" | "explore" | "shipments" | "trips" | "account";
  icon: LucideIcon;
  match: (path: string) => boolean;
};

const items: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "home",
    icon: Home,
    match: (p) => p === "/dashboard" || p === "/",
  },
  {
    href: "/explore",
    labelKey: "explore",
    icon: Compass,
    match: (p) => p.startsWith("/explore"),
  },
  {
    href: "/shipments",
    labelKey: "shipments",
    icon: Package,
    match: (p) => p.startsWith("/shipments") || p.startsWith("/sending"),
  },
  {
    href: "/trips",
    labelKey: "trips",
    icon: Route,
    match: (p) => p.startsWith("/my-trips") || p.startsWith("/trips"),
  },
  {
    href: "/profile",
    labelKey: "account",
    icon: User,
    match: (p) =>
      p.startsWith("/profile") ||
      p.startsWith("/notifications") ||
      p.startsWith("/messages"),
  },
];

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
      aria-label={t("home")}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, labelKey, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-tight transition-colors",
                  active
                    ? "text-emerald-700"
                    : "text-muted-foreground hover:text-slate-700"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.25]")}
                  aria-hidden
                />
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
