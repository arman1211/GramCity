"use client";

import { Calculator } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ApiClientError, getQuote, listLocations } from "@/lib/api";
import type { Locale, Location, ParcelSize, Quote } from "@/lib/types";
import { formatBdt, tLocal } from "@/lib/utils";
import { toast } from "sonner";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const tParcel = useTranslations("parcel.size");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  const [locations, setLocations] = useState<Location[]>([]);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [weightKg, setWeightKg] = useState("2");
  const [size, setSize] = useState<ParcelSize>("small");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listLocations()
      .then(setLocations)
      .catch(() => toast.error(tCommon("error")));
  }, [tCommon]);

  const handleEstimate = useCallback(async () => {
    if (!originId || !destinationId) {
      toast.error(tCommon("required"));
      return;
    }
    const w = Number(weightKg);
    if (!w || w <= 0) {
      toast.error(tCommon("required"));
      return;
    }
    setLoading(true);
    try {
      const q = await getQuote({
        originId,
        destinationId,
        weightKg: w,
        size,
      });
      setQuote(q);
    } catch (e) {
      setQuote(null);
      toast.error(e instanceof ApiClientError ? e.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [originId, destinationId, weightKg, size, tCommon]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="flex items-start gap-3">
        <Calculator className="mt-1 size-6 text-emerald-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
        </div>
      </header>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{tCommon("from")}</Label>
              <Select value={originId || undefined} onValueChange={setOriginId}>
                <SelectTrigger className="min-h-11 w-full">
                  <SelectValue placeholder={tCommon("from")} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {tLocal(loc.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tCommon("to")}</Label>
              <Select
                value={destinationId || undefined}
                onValueChange={setDestinationId}
              >
                <SelectTrigger className="min-h-11 w-full">
                  <SelectValue placeholder={tCommon("to")} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {tLocal(loc.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight">{tCommon("weight")} (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={0.1}
                step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{tLocal({ bn: "আকার", en: "Size" }, locale)}</Label>
              <Select value={size} onValueChange={(v) => setSize(v as ParcelSize)}>
                <SelectTrigger className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{tParcel("small")}</SelectItem>
                  <SelectItem value="medium">{tParcel("medium")}</SelectItem>
                  <SelectItem value="large">{tParcel("large")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            className="min-h-11 w-full sm:w-auto"
            disabled={loading}
            onClick={() => void handleEstimate()}
          >
            {loading ? tCommon("loading") : t("estimate")}
          </Button>
        </CardContent>
      </Card>

      {quote ? (
        <Card className="mt-6 border-emerald-100">
          <CardHeader>
            <CardTitle className="text-base">{t("itemized")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {tLocal(quote.routeLabel, locale)} · {quote.weightKg} kg
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {quote.lines.map((line) => (
                <li
                  key={line.code}
                  className="flex justify-between gap-4 border-b border-border pb-2 last:border-0"
                >
                  <span className="text-slate-700">{tLocal(line.label, locale)}</span>
                  <span className="font-medium text-slate-900">
                    {formatBdt(line.amountMinor, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between pt-2 text-base font-semibold text-emerald-800">
              <span>{t("estimate")}</span>
              <span>{formatBdt(quote.totalMinor, locale)}</span>
            </p>
            <p className="rounded-md border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
              {t("demoDisclaimer")}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
