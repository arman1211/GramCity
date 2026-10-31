"use client";

import { MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listCarrying, listReceiving, listSending } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { ShipmentWithDetails } from "@/lib/types";

export default function MessagesIndexPage() {
  return (
    <AuthGate>
      <MessagesIndexContent />
    </AuthGate>
  );
}

function MessagesIndexContent() {
  const t = useTranslations("messages");
  const tCommon = useTranslations("common");

  const [shipments, setShipments] = useState<ShipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [s, r, c] = await Promise.all([
          listSending(),
          listReceiving(),
          listCarrying(),
        ]);
        setShipments([...s, ...r, ...c]);
      } catch (e) {
        toastApiError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unique = useMemo(() => {
    const map = new Map<string, ShipmentWithDetails>();
    for (const s of shipments) {
      map.set(s.id, s);
    }
    return [...map.values()];
  }, [shipments]);

  return (
    <AppPage title={t("title")}>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : unique.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title={tCommon("empty")} />
      ) : (
        <ul className="space-y-2">
          {unique.map((s) => (
            <li key={s.id}>
              <Link
                href={`/messages/${s.id}`}
                className="flex min-h-11 items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {s.trackingNumber}
                <span className="text-muted-foreground">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
