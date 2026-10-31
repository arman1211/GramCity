"use client";

import {
  AlertCircle,
  BadgeCheck,
  Clock,
  MapPin,
  Scale,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { ShipmentCard } from "@/components/shared/shipment-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@/i18n/navigation";
import {
  acceptShipment,
  getTrip,
  listTripRequests,
  rejectShipment,
} from "@/lib/api";
import { ApiClientError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toast-api";
import type { Locale, ShipmentWithDetails, TripWithDetails } from "@/lib/types";
import { cn, formatDateTime, tLocal } from "@/lib/utils";

export default function TripDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const t = useTranslations("myTrips");
  const tTrip = useTranslations("trip");
  const tParcel = useTranslations("parcel.category");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const { user } = useAuth();

  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [requests, setRequests] = useState<ShipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const tr = await getTrip(id);
      setTrip(tr);
      if (user?.id === tr.travelerId) {
        try {
          setRequests(await listTripRequests(id));
        } catch {
          setRequests([]);
        }
      } else {
        setRequests([]);
      }
    } catch (e) {
      setTrip(null);
      setError(e instanceof ApiClientError ? e.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [id, tCommon, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRequest(shipmentId: string, accept: boolean) {
    setBusy(shipmentId);
    try {
      if (accept) {
        await acceptShipment(shipmentId);
        toast.success(t("accept"));
      } else {
        await rejectShipment(shipmentId);
        toast.success(t("reject"));
      }
      await load();
    } catch (e) {
      toastApiError(e);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <AppPage title={tTrip("details")}>
        <Skeleton className="h-40 w-full" />
      </AppPage>
    );
  }

  if (error || !trip) {
    return (
      <AppPage title={tTrip("details")}>
        <EmptyState
          icon={<AlertCircle />}
          title={tCommon("error")}
          description={error ?? tCommon("empty")}
          action={
            <Button asChild variant="outline">
              <Link href="/explore">{tCommon("back")}</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  const isOwner = user?.id === trip.travelerId;
  const originName = tLocal(trip.origin.name, locale);
  const destName = tLocal(trip.destination.name, locale);
  const verifiedLabel = tLocal({ bn: "যাচাইকৃত", en: "Verified" }, locale);

  return (
    <AppPage
      title={isOwner ? `${originName} → ${destName}` : tTrip("details")}
      description={isOwner ? undefined : `${originName} → ${destName}`}
      action={
        isOwner ? (
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`/trips/${trip.id}/edit`}>{tCommon("edit")}</Link>
          </Button>
        ) : undefined
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-emerald-600" aria-hidden />
            {formatDateTime(trip.departureAt, locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            {formatDateTime(trip.arrivalWindowStart, locale)}
            {" – "}
            {formatDateTime(trip.arrivalWindowEnd, locale)}
          </p>
          <p className="inline-flex items-center gap-2">
            <Scale className="size-4" aria-hidden />
            {t("remainingCapacity")}: {trip.remainingCapacityKg} / {trip.capacityKg} kg
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-emerald-600" aria-hidden />
            {tTrip("handover")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {trip.handoverPoints.map((hp) => (
              <li key={hp.id} className="rounded-md border border-border p-3">
                <p className="font-medium text-slate-800">{tLocal(hp.name, locale)}</p>
                <p className="text-muted-foreground">{tLocal(hp.address, locale)}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">{tTrip("parcelTypes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {trip.acceptedParcelTypes.map((cat) => (
              <li
                key={cat}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {tParcel(cat)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">{tTrip("traveler")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {trip.traveler.avatarInitials}
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
              <User className="size-4 text-muted-foreground" aria-hidden />
              {trip.traveler.displayName}
              {trip.traveler.isVerifiedTraveler ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                  <BadgeCheck className="size-3" aria-hidden />
                  {verifiedLabel}
                </span>
              ) : null}
            </p>
            <p className="text-sm text-muted-foreground">
              {trip.traveler.ratingAvg.toFixed(1)} ({trip.traveler.ratingCount})
            </p>
            <p className="mt-2 text-xs text-amber-800">{tTrip("ratingsDemo")}</p>
          </div>
        </CardContent>
      </Card>

      {isOwner ? (
        <section className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("requests")}
          </h2>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("empty")}</p>
          ) : (
            requests.map((s) => (
              <div key={s.id} className="space-y-2">
                <ShipmentCard shipment={s} />
                <div className="flex gap-2">
                  <Button
                    className="min-h-10 flex-1"
                    disabled={busy === s.id}
                    onClick={() => void handleRequest(s.id, true)}
                  >
                    {t("accept")}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-10 flex-1"
                    disabled={busy === s.id}
                    onClick={() => void handleRequest(s.id, false)}
                  >
                    {t("reject")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        <div
          className={cn(
            "fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] border-t border-border bg-background/95 p-4 backdrop-blur-sm md:static md:mt-6 md:border-0 md:bg-transparent md:p-0"
          )}
        >
          <Button asChild className="min-h-11 w-full md:w-auto">
            <Link href={`/shipments/new?tripId=${trip.id}`}>
              {tTrip("requestDelivery")}
            </Link>
          </Button>
        </div>
      )}
    </AppPage>
  );
}
