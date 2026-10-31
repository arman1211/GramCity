"use client";

import { Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { ShipmentCard } from "@/components/shared/shipment-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listSending } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { ShipmentStatus, ShipmentWithDetails } from "@/lib/types";

const STATUSES: ShipmentStatus[] = [
  "draft",
  "requested",
  "accepted",
  "confirmed",
  "picked_up",
  "in_transit",
  "ready_for_handover",
  "delivered",
  "cancelled",
];

export default function SendingPage() {
  return (
    <AuthGate>
      <SendingContent />
    </AuthGate>
  );
}

function SendingContent() {
  const t = useTranslations("sending");
  const tStatus = useTranslations("status.shipment");
  const tCommon = useTranslations("common");
  const tShip = useTranslations("shipment");

  const [items, setItems] = useState<ShipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSending({
        q: q || undefined,
        status: status === "all" ? undefined : (status as ShipmentStatus),
      });
      setItems(data);
    } catch (e) {
      toastApiError(e);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const tmr = setTimeout(() => void load(), 200);
    return () => clearTimeout(tmr);
  }, [load]);

  return (
    <AppPage
      title={t("title")}
      action={
        <Button asChild className="min-h-11">
          <Link href="/shipments/new">{tShip("create")}</Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="min-h-11 flex-1"
          placeholder={t("searchTracking")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="min-h-11 w-full sm:w-48">
            <SelectValue placeholder={tCommon("filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon("filter")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={tCommon("empty")}
          action={
            <Button asChild>
              <Link href="/shipments/new">{tShip("create")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <ShipmentCard key={s.id} shipment={s} />
          ))}
        </div>
      )}
    </AppPage>
  );
}
