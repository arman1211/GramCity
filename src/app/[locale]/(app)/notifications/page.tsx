"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { Locale, NotificationItem } from "@/lib/types";
import { cn, formatDateTime, tLocal } from "@/lib/utils";

export default function NotificationsPage() {
  return (
    <AuthGate>
      <NotificationsContent />
    </AuthGate>
  );
}

function NotificationsContent() {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listNotifications());
    } catch (e) {
      toastApiError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openNotification(n: NotificationItem) {
    try {
      if (!n.read) await markNotificationRead(n.id);
      await load();
    } catch (e) {
      toastApiError(e);
    }
  }

  return (
    <AppPage
      title={t("title")}
      action={
        items.length > 0 ? (
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() =>
              void markAllNotificationsRead()
                .then(load)
                .catch(toastApiError)
            }
          >
            {t("markAllRead")}
          </Button>
        ) : null
      }
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Bell />} title={t("empty")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {items.map((n) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-slate-900">
                    {tLocal(n.title, locale)}
                  </span>
                  {!n.read ? (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                  ) : null}
                </div>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {tLocal(n.body, locale)}
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {formatDateTime(n.createdAt, locale)}
                </span>
              </>
            );

            const className = cn(
              "block w-full px-4 py-3.5 text-left transition hover:bg-muted/70",
              !n.read && "bg-emerald-50/40"
            );

            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    href={n.href}
                    className={className}
                    onClick={() => void openNotification(n)}
                  >
                    {content}
                    <span className="mt-2 inline-block text-sm font-medium text-emerald-700">
                      {tCommon("continue")} →
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={className}
                    onClick={() => void openNotification(n)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppPage>
  );
}
