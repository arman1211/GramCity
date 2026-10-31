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

  return (
    <AppPage
      title={t("title")}
      action={
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
      }
    >
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Bell />} title={t("empty")} />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-muted",
                  !n.read && "bg-emerald-50/50"
                )}
                onClick={() =>
                  void markNotificationRead(n.id)
                    .then(load)
                    .catch(toastApiError)
                }
              >
                <span className="font-medium text-slate-900">
                  {tLocal(n.title, locale)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {tLocal(n.body, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(n.createdAt, locale)}
                </span>
                {n.href ? (
                  <Link
                    href={n.href}
                    className="text-sm font-medium text-emerald-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tCommon("continue")}
                  </Link>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
