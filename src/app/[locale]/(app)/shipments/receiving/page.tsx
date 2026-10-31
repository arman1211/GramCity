"use client";

import { PackageOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { ShipmentCard } from "@/components/shared/shipment-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listReceiving, sendMessage } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { ShipmentWithDetails } from "@/lib/types";

export default function ReceivingPage() {
  return (
    <AuthGate>
      <ReceivingContent />
    </AuthGate>
  );
}

function ReceivingContent() {
  const t = useTranslations("receiving");
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<ShipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listReceiving());
    } catch (e) {
      toastApiError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function stubAction(id: string, label: string) {
    setBusyId(id);
    try {
      await sendMessage(id, `[Demo] ${label}`);
      toast.success(label);
      await load();
    } catch (e) {
      toastApiError(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppPage title={t("title")}>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : items.length === 0 ? (
        <EmptyState icon={<PackageOpen />} title={tCommon("empty")} />
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <div key={s.id} className="space-y-2">
              <ShipmentCard shipment={s} />
              <div className="flex flex-wrap gap-2 px-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-10"
                  disabled={busyId === s.id}
                  onClick={() => void stubAction(s.id, t("acknowledge"))}
                >
                  {t("acknowledge")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-10"
                  disabled={busyId === s.id}
                  onClick={() => void stubAction(s.id, t("confirmAvailability"))}
                >
                  {t("confirmAvailability")}
                </Button>
                <Button size="sm" variant="outline" className="min-h-10" asChild>
                  <Link href={`/shipments/${s.id}`}>{t("confirmReceipt")}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppPage>
  );
}
