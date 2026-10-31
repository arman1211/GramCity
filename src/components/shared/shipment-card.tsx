"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const tStatus = useTranslations("status.shipment");
  const locale = useLocale() as Locale;

  const originName = tLocal(shipment.origin.name, locale);
  const destName = tLocal(shipment.destination.name, locale);
  const statusLabel = tStatus(shipment.status);

  return (
    <Card className={cn("transition-colors hover:border-emerald-200", className)}>
      <Link href={`/shipments/${shipment.id}`} className="block">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              {t("tracking")}: {shipment.trackingNumber}
            </CardTitle>
            <StatusBadge
              status={shipment.status}
              type="shipment"
              label={statusLabel}
            />
          </div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
            <span>{originName}</span>
            <ArrowRight className="size-4 shrink-0 text-emerald-600" aria-hidden />
            <span>{destName}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="text-muted-foreground">{tCommon("from")}: </span>
            {shipment.sender.displayName}
          </p>
          <p>
            <span className="text-muted-foreground">
              {t("steps.receiver")}:{" "}
            </span>
            {shipment.receiver?.displayName ?? shipment.receiverName}
          </p>
          <p className="font-medium text-slate-800">
            {tCommon("price")}: {formatBdt(shipment.quoteTotalMinor, locale)}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
