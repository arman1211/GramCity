"use client";

import { Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { ShipmentCard } from "@/components/shared/shipment-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { confirmDelivery, listCarrying, transitionShipment } from "@/lib/api";
import { canTransition } from "@/lib/mock/transitions";
import { toastApiError } from "@/lib/toast-api";
import type { Locale, ShipmentWithDetails } from "@/lib/types";
import { tLocal } from "@/lib/utils";

export default function CarryingPage() {
  return (
    <AuthGate>
      <CarryingContent />
    </AuthGate>
  );
}

function CarryingContent() {
  const t = useTranslations("carrying");
  const tRec = useTranslations("receiving");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  const [items, setItems] = useState<ShipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listCarrying());
    } catch (e) {
      toastApiError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShipmentWithDetails[]>();
    for (const s of items) {
      const key = s.tripId ?? "unknown";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [items]);

  async function transition(id: string, to: Parameters<typeof transitionShipment>[1]) {
    setBusy(id);
    try {
      await transitionShipment(id, to);
      toast.success(tCommon("confirm"));
      await load();
    } catch (e) {
      toastApiError(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppPage title={t("title")}>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Truck />} title={tCommon("empty")} />
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([tripId, parcels]) => {
            const trip = parcels[0]?.trip;
            const title = trip
              ? `${tLocal(trip.origin.name, locale)} → ${tLocal(trip.destination.name, locale)}`
              : tripId;
            return (
              <section key={tripId} className="space-y-3">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <p className="text-sm text-muted-foreground">{t("checklist")}</p>
                {parcels.map((s) => (
                  <div key={s.id} className="space-y-2">
                    <ShipmentCard shipment={s} />
                    <div className="flex flex-wrap gap-2">
                      {canTransition(s.status, "confirmed") ? (
                        <Button
                          size="sm"
                          className="min-h-10"
                          disabled={busy === s.id}
                          onClick={() => void transition(s.id, "confirmed")}
                        >
                          {tCommon("confirm")}
                        </Button>
                      ) : null}
                      {canTransition(s.status, "picked_up") ? (
                        <Button
                          size="sm"
                          className="min-h-10"
                          disabled={busy === s.id}
                          onClick={() => void transition(s.id, "picked_up")}
                        >
                          {t("markPickedUp")}
                        </Button>
                      ) : null}
                      {canTransition(s.status, "in_transit") ? (
                        <Button
                          size="sm"
                          className="min-h-10"
                          disabled={busy === s.id}
                          onClick={() => void transition(s.id, "in_transit")}
                        >
                          {t("markInTransit")}
                        </Button>
                      ) : null}
                      {canTransition(s.status, "ready_for_handover") ? (
                        <Button
                          size="sm"
                          className="min-h-10"
                          disabled={busy === s.id}
                          onClick={() =>
                            void transition(s.id, "ready_for_handover")
                          }
                        >
                          {t("markReady")}
                        </Button>
                      ) : null}
                      {["in_transit", "ready_for_handover"].includes(s.status) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="min-h-10"
                          onClick={() => {
                            setCodeOpen(s.id);
                            setCode("");
                          }}
                        >
                          {t("completeDelivery")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(codeOpen)} onOpenChange={() => setCodeOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tRec("enterCode")}</DialogTitle>
          </DialogHeader>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-11"
            inputMode="numeric"
          />
          <DialogFooter>
            <Button
              disabled={!code.trim() || !codeOpen}
              onClick={() =>
                void (async () => {
                  if (!codeOpen) return;
                  setBusy(codeOpen);
                  try {
                    await confirmDelivery(codeOpen, code);
                    toast.success(t("completeDelivery"));
                    setCodeOpen(null);
                    await load();
                  } catch (e) {
                    toastApiError(e);
                  } finally {
                    setBusy(null);
                  }
                })()
              }
            >
              {tCommon("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}
