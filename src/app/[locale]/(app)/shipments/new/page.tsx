"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { CreateShipmentWizard } from "@/components/shared/create-shipment-wizard";
import { Skeleton } from "@/components/ui/skeleton";

function NewShipmentInner() {
  const t = useTranslations("shipment");
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") ?? undefined;
  const draftId = searchParams.get("draftId") ?? undefined;

  return (
    <AppPage title={t("create")}>
      <CreateShipmentWizard initialTripId={tripId} draftId={draftId} />
    </AppPage>
  );
}

export default function NewShipmentPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-4 py-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-6 h-64 w-full" />
          </div>
        }
      >
        <NewShipmentInner />
      </Suspense>
    </AuthGate>
  );
}
