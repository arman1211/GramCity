"use client";

import { ArrowRight, Package, Plane, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { ShipmentCard } from "@/components/shared/shipment-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  listMyTrips,
  listNotifications,
  listReceiving,
  listSending,
} from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { Locale, NotificationItem, ShipmentWithDetails, TripWithDetails } from "@/lib/types";
import { formatDateTime, tLocal } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const locale = useLocale() as Locale;

  const [sending, setSending] = useState<ShipmentWithDetails[]>([]);
  const [receiving, setReceiving] = useState<ShipmentWithDetails[]>([]);
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [s, r, tr, n] = await Promise.all([
          listSending(),
          listReceiving(),
          listMyTrips(),
          listNotifications(),
        ]);
        setSending(s);
        setReceiving(r);
        setTrips(tr);
        setNotifications(n);
      } catch (e) {
        toastApiError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeSending = sending.filter(
    (x) => !["delivered", "cancelled", "rejected"].includes(x.status)
  );
  const activeReceiving = receiving.filter(
    (x) => !["delivered", "cancelled", "rejected"].includes(x.status)
  );
  const upcomingTrips = trips.filter((x) =>
    ["open", "full", "in_progress"].includes(x.status)
  );

  const upcomingActions = [
    ...activeReceiving
      .filter((x) => x.status === "ready_for_handover")
      .slice(0, 2)
      .map((x) => ({
        id: `recv-${x.id}`,
        label: x.trackingNumber,
        href: `/shipments/${x.id}`,
      })),
    ...activeSending
      .filter((x) => x.status === "draft")
      .slice(0, 2)
      .map((x) => ({
        id: `send-${x.id}`,
        label: x.trackingNumber,
        href: `/shipments/new?draftId=${x.id}`,
      })),
  ];

  // A shipment can appear in both sending and receiving (e.g. self-receive).
  const recent = [
    ...new Map(
      [...sending, ...receiving]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((s) => [s.id, s] as const)
    ).values(),
  ].slice(0, 3);

  if (loading) {
    return (
      <AppPage title={t("title")}>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </AppPage>
    );
  }

  return (
    <AppPage title={t("title")}>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("quickActions")}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button asChild className="min-h-11 h-auto flex-col gap-1 py-3">
            <Link href="/shipments/new">
              <Send className="size-5" />
              {tNav("send")}
            </Link>
          </Button>
          <Button asChild variant="secondary" className="min-h-11 h-auto flex-col gap-1 py-3">
            <Link href="/trips/new">
              <Plane className="size-5" />
              {tNav("postTrip")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 h-auto flex-col gap-1 py-3">
            <Link href="/shipments/sending">
              <Package className="size-5" />
              {t("sendingSummary")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 h-auto flex-col gap-1 py-3">
            <Link href="/shipments/receiving">{t("receivingSummary")}</Link>
          </Button>
        </div>
      </section>

      {upcomingActions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("upcoming")}
          </h2>
          <ul className="space-y-2">
            {upcomingActions.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="flex min-h-11 items-center justify-between rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
                >
                  {a.label}
                  <ArrowRight className="size-4 text-emerald-600" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title={t("sendingSummary")}
          value={activeSending.length}
          href="/shipments/sending"
        />
        <SummaryCard
          title={t("receivingSummary")}
          value={activeReceiving.length}
          href="/shipments/receiving"
        />
        <SummaryCard
          title={t("tripsSummary")}
          value={upcomingTrips.length}
          href="/trips"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("recent")}
          </h2>
          <Link href="/notifications" className="text-sm font-medium text-emerald-700">
            {tNav("notifications")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <div className="space-y-3">
            {recent.map((s) => (
              <ShipmentCard key={s.id} shipment={s} />
            ))}
          </div>
        )}
        {notifications.slice(0, 2).map((n) => (
          <p key={n.id} className="text-xs text-muted-foreground">
            {tLocal(n.title, locale)} · {formatDateTime(n.createdAt, locale)}
          </p>
        ))}
      </section>
    </AppPage>
  );
}

function SummaryCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="text-3xl font-semibold text-slate-900">{value}</span>
        <Link href={href} className="text-sm font-medium text-emerald-700">
          →
        </Link>
      </CardContent>
    </Card>
  );
}
