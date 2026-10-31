"use client";

import {
  Bell,
  CircleDollarSign,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  PackageOpen,
  Route,
  Send,
  Truck,
  User,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LogoMark } from "@/components/brand/logo-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useAuth } from "@/hooks/use-auth";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/lib/types";
import { cn, tLocal } from "@/lib/utils";

type NavLink = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const receiverLinks: NavLink[] = [
  { href: "/shipments/sending", labelKey: "sending", icon: Send },
  { href: "/shipments/receiving", labelKey: "receiving", icon: PackageOpen },
];

const travelerLinks: NavLink[] = [
  { href: "/trips", labelKey: "myTrips", icon: Route },
  { href: "/carrying", labelKey: "carrying", icon: Truck },
  { href: "/earnings", labelKey: "earnings", icon: CircleDollarSign },
];

const accountLinks: NavLink[] = [
  { href: "/notifications", labelKey: "notifications", icon: Bell },
  { href: "/messages", labelKey: "messages", icon: MessageSquare },
  { href: "/profile", labelKey: "profile", icon: User },
  { href: "/support", labelKey: "support", icon: HelpCircle },
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-emerald-800"
          : "text-slate-600 hover:bg-muted hover:text-slate-900"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

function SidebarSection({
  title,
  links,
  pathname,
  t,
}: {
  title: string;
  links: NavLink[];
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {links.map(({ href, labelKey, icon }) => (
        <SidebarLink
          key={href}
          href={href}
          label={t(labelKey)}
          icon={icon}
          active={pathname === href || pathname.startsWith(`${href}/`)}
        />
      ))}
    </div>
  );
}

export function AppSidebar({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { user } = useAuth();

  const overviewActive =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const receiverSection = tLocal(
    { bn: "পাঠানো ও গ্রহণ", en: "Send & receive" },
    locale
  );
  const travelerSection = tLocal(
    { bn: "ভ্রমণকারী", en: "Traveler" },
    locale
  );
  const accountSection = tLocal(
    { bn: "অ্যাকাউন্ট", en: "Account" },
    locale
  );

  return (
    <aside
      className={cn(
        "hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <Link href="/dashboard" className="min-w-0">
          <LogoMark size="sm" showBangla={false} />
        </Link>
        <LanguageSwitcher />
      </div>
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        <SidebarLink
          href="/dashboard"
          label={t("dashboard")}
          icon={LayoutDashboard}
          active={overviewActive}
        />
        <SidebarSection
          title={receiverSection}
          links={receiverLinks}
          pathname={pathname}
          t={t}
        />
        <SidebarSection
          title={travelerSection}
          links={travelerLinks}
          pathname={pathname}
          t={t}
        />
        <div className="space-y-1 border-t border-border pt-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {accountSection}
          </p>
          {accountLinks.map(({ href, labelKey, icon }) => (
            <SidebarLink
              key={href}
              href={href}
              label={t(labelKey)}
              icon={icon}
              active={pathname === href || pathname.startsWith(`${href}/`)}
            />
          ))}
        </div>
      </nav>
      {user ? (
        <div className="border-t border-border p-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
              {user.avatarInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-900">
                {user.displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.phoneMasked}
              </span>
            </span>
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
