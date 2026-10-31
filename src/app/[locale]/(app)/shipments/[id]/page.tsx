"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { ShipmentDetailActions } from "@/components/shared/shipment-detail-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getShipment } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { Locale, ShipmentWithDetails } from "@/lib/types";
import { formatBdt, formatDateTime, tLocal } from "@/lib/utils";

export default function ShipmentDetailPage() {
  return (
    <AuthGate>
      <ShipmentDetailContent />
    </AuthGate>
  );
}

function ShipmentDetailContent() {
  const params = useParams();
  const id = String(params.id);
  const t = useTranslations("shipment");
  const tStatus = useTranslations("status.shipment");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const { user } = useAuth();

  const [shipment, setShipment] = useState<ShipmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setShipment(await getShipment(id));
    } catch (e) {
      setShipment(null);
      setFailed(true);
      toastApiError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <AppPage title={t("tracking")}>
        <Skeleton className="h-40 w-full" />
      </AppPage>
    );
  }

  if (failed || !shipment) {
    return (
      <AppPage title={t("tracking")}>
        <p className="text-sm text-muted-foreground">{tCommon("error")}</p>
      </AppPage>
    );
  }

  return (
    <AppPage title={`${t("tracking")}: ${shipment.trackingNumber}`}>
      <div className="space-y-6 pb-32">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={shipment.status}
            type="shipment"
            label={tStatus(shipment.status)}
          />
          <span className="text-sm font-medium text-slate-800">
            {formatBdt(shipment.quoteTotalMinor, locale)}
          </span>
        </div>

        <div className="rounded-lg border border-border p-4 text-sm text-slate-700">
          <p>
            {tLocal(shipment.origin.name, locale)} →{" "}
            {tLocal(shipment.destination.name, locale)}
          </p>
          <p className="mt-2">{shipment.parcel.description}</p>
          <p className="mt-1 text-muted-foreground">
            {tCommon("weight")}: {shipment.parcel.weightKg} kg
          </p>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("timeline")}
          </h2>
          <ol className="space-y-3 border-l-2 border-emerald-200 pl-4">
            {shipment.timeline.map((ev) => (
              <li key={ev.id} className="relative text-sm">
                <span className="font-medium text-slate-900">
                  {tLocal(ev.label, locale)}
                </span>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(ev.at, locale)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {user ? (
          <ShipmentDetailActions
            shipment={shipment}
            user={user}
            onUpdated={() => void load()}
          />
        ) : null}
      </div>
    </AppPage>
  );
}
