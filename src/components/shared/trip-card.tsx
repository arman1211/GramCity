"use client";

import { ArrowRight, BadgeCheck, Clock, Scale, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Locale, TripWithDetails } from "@/lib/types";
import { cn, formatBdt, formatDateTime, tLocal } from "@/lib/utils";

export type TripCardProps = {
  trip: TripWithDetails;
  className?: string;
  /** When false, render as a selectable panel (no navigation link). */
  interactive?: boolean;
  selected?: boolean;
  onSelect?: () => void;
};

export function TripCard({
  trip,
  className,
  interactive = true,
  selected = false,
  onSelect,
}: TripCardProps) {
  const t = useTranslations("trip");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  const verifiedLabel = tLocal({ bn: "যাচাইকৃত", en: "Verified" }, locale);
  const originName = tLocal(trip.origin.name, locale);
  const destName = tLocal(trip.destination.name, locale);

  const body = (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900">
          <span>{originName}</span>
          <ArrowRight className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span>{destName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <Clock
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div>
            <p>{formatDateTime(trip.departureAt, locale)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(trip.arrivalWindowStart, locale)}
              {" – "}
              {formatDateTime(trip.arrivalWindowEnd, locale)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Scale className="size-4 text-muted-foreground" aria-hidden />
            {t("capacity")}: {trip.remainingCapacityKg} kg
          </span>
          <span className="font-medium text-slate-800">
            {tCommon("price")}: {formatBdt(trip.pricePerKgMinor, locale)}/kg
          </span>
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-slate-700">
            {trip.traveler.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 font-medium text-slate-800">
              <User className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="truncate">{trip.traveler.displayName}</span>
              {trip.traveler.isVerifiedTraveler ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                  <BadgeCheck className="size-3" aria-hidden />
                  {verifiedLabel}
                </span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {trip.traveler.ratingAvg.toFixed(1)} ·{" "}
              {trip.traveler.tripsCompleted} {t("traveler")}
            </p>
          </div>
        </div>
      </CardContent>
      {interactive ? (
        <CardFooter className="border-t border-border pt-3 text-sm font-medium text-emerald-700">
          {t("details")} →
        </CardFooter>
      ) : null}
    </>
  );

  return (
    <Card
      className={cn(
        "transition-colors hover:border-emerald-200",
        selected && "border-emerald-600 ring-2 ring-emerald-600/30",
        className
      )}
    >
      {interactive ? (
        <Link href={`/trips/${trip.id}`} className="block">
          {body}
        </Link>
      ) : (
        <button
          type="button"
          className="block w-full cursor-pointer text-left"
          onClick={onSelect}
          aria-pressed={selected}
        >
          {body}
        </button>
      )}
    </Card>
  );
}
