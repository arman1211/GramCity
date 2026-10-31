"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { TripForm, type TripFormValues } from "@/components/shared/trip-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { getTrip, updateTrip } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { TripWithDetails } from "@/lib/types";

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditTripPage() {
  return (
    <AuthGate>
      <EditTripContent />
    </AuthGate>
  );
}

function EditTripContent() {
  const params = useParams();
  const id = String(params.id);
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setTrip(await getTrip(id));
      } catch (e) {
        toastApiError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !trip) {
    return (
      <AppPage title={tCommon("edit")}>
        <Skeleton className="h-40 w-full" />
      </AppPage>
    );
  }

  const defaults: Partial<TripFormValues> = {
    originId: trip.originId,
    destinationId: trip.destinationId,
    handoverPointIds: trip.handoverPointIds,
    departureAt: toLocalDatetime(trip.departureAt),
    arrivalWindowStart: toLocalDatetime(trip.arrivalWindowStart),
    arrivalWindowEnd: toLocalDatetime(trip.arrivalWindowEnd),
    capacityKg: trip.capacityKg,
    pricePerKgMinor: trip.pricePerKgMinor,
    acceptedParcelTypes: trip.acceptedParcelTypes,
    notes: trip.notes ?? "",
  };

  return (
    <AppPage title={tCommon("edit")}>
      <TripForm
        key={trip.id}
        defaultValues={defaults}
        submitLabel={tCommon("save")}
        onSubmit={async (values) => {
          try {
            await updateTrip(id, {
              originId: values.originId,
              destinationId: values.destinationId,
              handoverPointIds: values.handoverPointIds,
              departureAt: values.departureAt,
              arrivalWindowStart: values.arrivalWindowStart,
              arrivalWindowEnd: values.arrivalWindowEnd,
              capacityKg: values.capacityKg,
              pricePerKgMinor: values.pricePerKgMinor,
              acceptedParcelTypes: values.acceptedParcelTypes,
              notes: values.notes,
            });
            toast.success(tCommon("save"));
            router.push(`/trips/${id}`);
          } catch (e) {
            toastApiError(e);
          }
        }}
      />
    </AppPage>
  );
}
