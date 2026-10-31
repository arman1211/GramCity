"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listEarnings } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { Earning, Locale } from "@/lib/types";
import { formatBdt, formatDateTime, tLocal } from "@/lib/utils";

export default function EarningsPage() {
  return (
    <AuthGate>
      <EarningsContent />
    </AuthGate>
  );
}

function EarningsContent() {
  const t = useTranslations("earnings");
  const tStatus = useTranslations("status.payout");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  const [items, setItems] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listEarnings());
      } catch (e) {
        toastApiError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pending = items.filter((e) => e.payoutStatus === "pending");
  const completed = items.filter((e) => e.payoutStatus === "completed");

  return (
    <AppPage title={t("title")} description={t("simulatedNotice")}>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {t("pending")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatBdt(
                  pending.reduce((s, e) => s + e.amountMinor, 0),
                  locale
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {t("completed")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatBdt(
                  completed.reduce((s, e) => s + e.amountMinor, 0),
                  locale
                )}
              </CardContent>
            </Card>
          </div>

          <ul className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tCommon("empty")}</p>
            ) : (
              items.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {tLocal(e.description, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(e.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatBdt(e.amountMinor, locale)}
                    </span>
                    <StatusBadge
                      status={e.payoutStatus}
                      type="payout"
                      label={tStatus(e.payoutStatus)}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </AppPage>
  );
}
