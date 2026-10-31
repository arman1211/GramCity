"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { TripForm } from "@/components/shared/trip-form";
import { useRouter } from "@/i18n/navigation";
import { createTrip } from "@/lib/api";
import type { CreateTripInput } from "@/lib/types";
import { toastApiError } from "@/lib/toast-api";

export default function NewTripPage() {
  const t = useTranslations("myTrips");
  const tCommon = useTranslations("common");
  const router = useRouter();

  return (
    <AuthGate>
      <AppPage title={t("create")}>
        <TripForm
          submitLabel={tCommon("submit")}
          onSubmit={async (values: CreateTripInput) => {
            try {
              const trip = await createTrip(values);
              toast.success(t("create"));
              router.push(`/trips/${trip.id}`);
            } catch (e) {
              toastApiError(e);
            }
          }}
        />
      </AppPage>
    </AuthGate>
  );
}
