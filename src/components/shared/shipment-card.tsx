"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import type { Locale, ShipmentWithDetails } from "@/lib/types";
import { cn, formatBdt, tLocal } from "@/lib/utils";

export type ShipmentCardProps = {
  shipment: ShipmentWithDetails;
  className?: string;
};

export function ShipmentCard({ shipment, className }: ShipmentCardProps) {
  const t = useTranslations("shipment");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  const originName = tLocal(shipment.origin.name, locale);
  const destName = tLocal(shipment.destination.name, locale);

  return (
    <Link
      href={`/shipments/${shipment.id}`}
      className={cn(
        "block rounded-xl border border-border bg-card p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/20",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground">
            {shipment.trackingNumber}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            <span>{originName}</span>
            <ArrowRight className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span>{destName}</span>
          </p>
        </div>
        <StatusBadge status={shipment.status} type="shipment" />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3 text-sm text-slate-600">
        <p className="truncate">
          <span className="text-muted-foreground">{t("steps.receiver")}: </span>
          {shipment.receiver?.displayName ?? shipment.receiverName}
        </p>
        <p className="font-medium text-slate-800">
          {tCommon("price")}: {formatBdt(shipment.quoteTotalMinor, locale)}
        </p>
      </div>
    </Link>
  );
}
