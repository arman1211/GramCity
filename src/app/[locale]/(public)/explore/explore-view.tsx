"use client";

import { AlertCircle, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { RouteSearch, type RouteSearchValues } from "@/components/shared/route-search";
import { TripCard } from "@/components/shared/trip-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError, listLocations, listTrips } from "@/lib/api";
import type { Location, TripFilters, TripWithDetails } from "@/lib/types";

function parseSearchParams(search: URLSearchParams): {
  route: RouteSearchValues;
  minCapacityKg?: number;
  verifiedOnly: boolean;
  sort: TripFilters["sort"];
} {
  const minRaw = search.get("minCapacityKg");
  const min = minRaw ? Number(minRaw) : undefined;
  const sortRaw = search.get("sort");
  const sort: TripFilters["sort"] =
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "departure_desc"
      ? sortRaw
      : "departure_asc";

  return {
    route: {
      originId: search.get("originId") ?? "",
      destinationId: search.get("destinationId") ?? "",
      // Only filter by date when the user explicitly sets one (demo seed dates ≠ "today").
      date: search.get("date") ?? "",
    },
    minCapacityKg: min != null && !Number.isNaN(min) ? min : undefined,
    verifiedOnly: search.get("verifiedOnly") === "1",
    sort,
  };
}

function buildQuery(
  route: RouteSearchValues,
  minCapacityKg: number | undefined,
  verifiedOnly: boolean,
  sort: TripFilters["sort"],
): string {
  const params = new URLSearchParams();
  if (route.originId) params.set("originId", route.originId);
  if (route.destinationId) params.set("destinationId", route.destinationId);
  if (route.date) params.set("date", route.date);
  if (minCapacityKg != null && minCapacityKg > 0) {
    params.set("minCapacityKg", String(minCapacityKg));
  }
  if (verifiedOnly) params.set("verifiedOnly", "1");
  if (sort && sort !== "departure_asc") params.set("sort", sort);
  return params.toString();
}

export function ExploreView() {
  const t = useTranslations("explore");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const initial = useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );

  const [locations, setLocations] = useState<Location[]>([]);
  const [routeValues, setRouteValues] = useState<RouteSearchValues>(initial.route);
  const [minCapacityKg, setMinCapacityKg] = useState<number | undefined>(
    initial.minCapacityKg,
  );
  const [verifiedOnly, setVerifiedOnly] = useState(initial.verifiedOnly);
  const [sort, setSort] = useState<TripFilters["sort"]>(initial.sort ?? "departure_asc");
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (
      route: RouteSearchValues,
      minCap: number | undefined,
      verified: boolean,
      sortVal: TripFilters["sort"],
    ) => {
      const q = buildQuery(route, minCap, verified, sortVal);
      router.replace(q ? `/explore?${q}` : "/explore");
    },
    [router],
  );

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const locs = locations.length ? locations : await listLocations();
      if (!locations.length) setLocations(locs);

      const parsed = parseSearchParams(searchParams);
      const result = await listTrips({
        originId: parsed.route.originId || undefined,
        destinationId: parsed.route.destinationId || undefined,
        date: parsed.route.date || undefined,
        minCapacityKg: parsed.minCapacityKg,
        verifiedOnly: parsed.verifiedOnly,
        sort: parsed.sort,
        pageSize: 50,
      });
      setTrips(result.items);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [locations, searchParams, tCommon]);

  useEffect(() => {
    const parsed = parseSearchParams(searchParams);
    setRouteValues(parsed.route);
    setMinCapacityKg(parsed.minCapacityKg);
    setVerifiedOnly(parsed.verifiedOnly);
    setSort(parsed.sort ?? "departure_asc");
  }, [searchParams]);

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  function applySearch() {
    syncUrl(routeValues, minCapacityKg, verifiedOnly, sort);
  }

  function applyFilters() {
    syncUrl(routeValues, minCapacityKg, verifiedOnly, sort);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
      </header>

      <div className="mt-6 space-y-6">
        {locations.length === 0 && loading ? null : (
          <RouteSearch
            locations={locations}
            values={routeValues}
            onChange={setRouteValues}
            onSubmit={applySearch}
          />
        )}

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-slate-800">{t("filters")}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2 sm:w-40">
              <Label htmlFor="min-capacity">{t("capacity")}</Label>
              <Input
                id="min-capacity"
                type="number"
                min={0}
                step={0.5}
                value={minCapacityKg ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinCapacityKg(v === "" ? undefined : Number(v));
                }}
                className="min-h-11"
              />
            </div>
            <div className="flex min-h-11 items-center gap-2">
              <Checkbox
                id="verified-only"
                checked={verifiedOnly}
                onCheckedChange={(c) => setVerifiedOnly(c === true)}
              />
              <Label htmlFor="verified-only" className="cursor-pointer text-sm">
                {t("verifiedOnly")}
              </Label>
            </div>
            <div className="space-y-2 sm:w-52">
              <Label>{tCommon("sort")}</Label>
              <Select
                value={sort ?? "departure_asc"}
                onValueChange={(v) => setSort(v as TripFilters["sort"])}
              >
                <SelectTrigger className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departure_asc">{t("sortDeparture")}</SelectItem>
                  <SelectItem value="price_asc">{t("sortPrice")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="min-h-11" onClick={applyFilters}>
              {tCommon("apply")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
        ) : error ? (
          <EmptyState
            icon={<AlertCircle />}
            title={tCommon("error")}
            description={error}
            action={
              <Button type="button" onClick={() => void fetchTrips()}>
                {tCommon("retry")}
              </Button>
            }
          />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title={tCommon("noResults")}
            description={t("noResults")}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const cleared: RouteSearchValues = {
                    originId: "",
                    destinationId: "",
                    date: "",
                  };
                  setRouteValues(cleared);
                  setMinCapacityKg(undefined);
                  setVerifiedOnly(false);
                  setSort("departure_asc");
                  syncUrl(cleared, undefined, false, "departure_asc");
                }}
              >
                {tCommon("clear")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
