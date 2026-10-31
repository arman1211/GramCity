"use client";

import {
  AlertCircle,
  ArrowRight,
  Package,
  Route,
  Shield,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { RouteMapArt } from "@/components/home/route-map-art";
import {
  RouteSearch,
  type RouteSearchValues,
} from "@/components/shared/route-search";
import { TripCard } from "@/components/shared/trip-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError, listLocations, listTrips } from "@/lib/api";
import type { Location, TripWithDetails } from "@/lib/types";

export default function HomePage() {
  const t = useTranslations("home");
  const tBrand = useTranslations("brand");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [locations, setLocations] = useState<Location[]>([]);
  const [sampleTrips, setSampleTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [routeValues, setRouteValues] = useState<RouteSearchValues>({
    originId: "",
    destinationId: "",
    date: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [locs, trips] = await Promise.all([
        listLocations(),
        listTrips({ pageSize: 6, sort: "departure_asc" }),
      ]);
      setLocations(locs);
      setSampleTrips(trips.items.slice(0, 3));
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleRouteSearch() {
    const params = new URLSearchParams();
    if (routeValues.originId) params.set("originId", routeValues.originId);
    if (routeValues.destinationId) {
      params.set("destinationId", routeValues.destinationId);
    }
    if (routeValues.date) params.set("date", routeValues.date);
    const q = params.toString();
    router.push(q ? `/explore?${q}` : "/explore");
  }

  const howItems = [
    {
      key: "send",
      title: t("howSendTitle"),
      body: t("howSend"),
      icon: Package,
      href: "/shipments/new",
    },
    {
      key: "receive",
      title: t("howReceiveTitle"),
      body: t("howReceive"),
      icon: Truck,
      href: "/shipments/receiving",
    },
    {
      key: "carry",
      title: t("howCarryTitle"),
      body: t("howCarry"),
      icon: Route,
      href: "/trips/new",
    },
  ] as const;

  return (
    <div className="overflow-x-hidden">
      {/* Hero — one composition: brand, headline, subtitle, CTAs, route visual */}
      <section className="gc-home-hero relative border-b border-emerald-100/80">
        <div className="gc-dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-20 lg:pt-16">
          <div className="min-w-0">
            <p className="gc-fade-up text-2xl font-semibold tracking-tight text-emerald-900 sm:text-3xl md:text-4xl">
              <span className="block">GramCity Express</span>
              <span className="mt-1 block font-medium text-emerald-700">
                গ্রামসিটি এক্সপ্রেস
              </span>
            </p>
            <p className="gc-fade-up-delay-1 mt-2 text-sm font-medium text-emerald-800/80">
              {tBrand("tagline")}
            </p>
            <h1 className="gc-fade-up-delay-1 mt-5 max-w-xl text-balance text-xl font-semibold leading-snug text-slate-900 sm:text-2xl md:text-[1.75rem]">
              {t("heroTitle")}
            </h1>
            <p className="gc-fade-up-delay-2 mt-3 max-w-lg text-pretty text-base leading-relaxed text-slate-600">
              {t("heroSubtitle")}
            </p>
            <div className="gc-fade-up-delay-3 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="min-h-12 w-full gap-2 px-6 text-base shadow-sm shadow-emerald-900/10 sm:w-auto"
              >
                <Link href="/shipments/new">
                  <Package className="size-4" aria-hidden />
                  {t("sendCta")}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-12 w-full gap-2 border-emerald-200 bg-white/70 px-6 text-base text-emerald-900 hover:bg-white sm:w-auto"
              >
                <Link href="/trips/new">
                  <Route className="size-4" aria-hidden />
                  {t("tripCta")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="gc-fade-up-delay-2 relative mx-auto w-full max-w-md lg:max-w-none">
            <RouteMapArt className="h-auto w-full drop-shadow-sm" />
          </div>
        </div>
      </section>

      {/* Route search */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("routeSearch")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("routeSearchHint")}
          </p>
        </div>
        {loading && locations.length === 0 ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : error ? (
          <EmptyState
            icon={<AlertCircle />}
            title={tCommon("error")}
            description={error}
            action={
              <Button type="button" onClick={() => void load()}>
                {tCommon("retry")}
              </Button>
            }
          />
        ) : (
          <RouteSearch
            locations={locations}
            values={routeValues}
            onChange={setRouteValues}
            onSubmit={handleRouteSearch}
            className="border-emerald-100/80 bg-white shadow-none"
          />
        )}
      </section>

      {/* How it works — one job, light rows not heavy card grid */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
          <h2 className="text-lg font-semibold text-slate-900">{t("howTitle")}</h2>
          <ul className="mt-8 divide-y divide-border">
            {howItems.map(({ key, title, body, icon: Icon, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="group flex min-h-[4.5rem] items-start gap-4 py-5 transition-colors hover:bg-emerald-50/40 sm:items-center sm:gap-6"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {body}
                    </p>
                  </div>
                  <ArrowRight
                    className="mt-1 size-4 shrink-0 text-emerald-600 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 sm:mt-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Upcoming trips */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t("routesTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("routesSubtitle")}
            </p>
          </div>
          <Button asChild variant="ghost" className="text-emerald-800">
            <Link href="/explore">
              {tCommon("viewAll")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : sampleTrips.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{tCommon("empty")}</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sampleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      {/* Safety + pricing */}
      <section className="border-t border-border bg-slate-50/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:gap-12 sm:py-14">
          <div>
            <Shield className="size-5 text-emerald-700" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              {tNav("safety")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t("safetyTeaser")}
            </p>
            <Button
              asChild
              variant="link"
              className="mt-2 h-auto px-0 text-emerald-800"
            >
              <Link href="/safety">
                {tNav("safety")}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
          <div>
            <Package className="size-5 text-emerald-700" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              {t("pricingLink")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t("pricingHint")}
            </p>
            <Button asChild className="mt-4 min-h-11">
              <Link href="/pricing">{tNav("pricing")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
