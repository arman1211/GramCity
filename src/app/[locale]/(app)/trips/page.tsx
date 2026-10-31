"use client";

import { Route, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { TripCard } from "@/components/shared/trip-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listMyTrips } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { TripWithDetails } from "@/lib/types";

export default function TripsPage() {
  return (
    <AuthGate>
      <TripsContent />
    </AuthGate>
  );
}

function TripsContent() {
  const t = useTranslations("myTrips");
  const tCarry = useTranslations("carrying");
  const tCommon = useTranslations("common");

  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await listMyTrips());
    } catch (e) {
      toastApiError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppPage
      title={t("title")}
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/carrying">
              <Truck className="size-4" aria-hidden />
              {tCarry("title")}
            </Link>
          </Button>
          <Button asChild className="min-h-11">
            <Link href="/trips/new">{t("create")}</Link>
          </Button>
        </div>
      }
    >
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={<Route />}
          title={tCommon("empty")}
          action={
            <Button asChild>
              <Link href="/trips/new">{t("create")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </AppPage>
  );
}
