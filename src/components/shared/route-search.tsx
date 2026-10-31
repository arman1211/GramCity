"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale, Location } from "@/lib/types";
import { cn, tLocal } from "@/lib/utils";

export type RouteSearchValues = {
  originId: string;
  destinationId: string;
  date: string;
};

export type RouteSearchProps = {
  locations: Location[];
  values: RouteSearchValues;
  onChange: (values: RouteSearchValues) => void;
  onSubmit: () => void;
  className?: string;
  submitLabel?: string;
};

export function RouteSearch({
  locations,
  values,
  onChange,
  onSubmit,
  className,
  submitLabel,
}: RouteSearchProps) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;

  function update(partial: Partial<RouteSearchValues>) {
    onChange({ ...values, ...partial });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5",
        className
      )}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="route-origin">{t("from")}</Label>
          <Select
            value={values.originId || undefined}
            onValueChange={(originId) => update({ originId })}
          >
            <SelectTrigger id="route-origin" className="min-h-11 w-full">
              <SelectValue placeholder={t("from")} />
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
          <Label htmlFor="route-destination">{t("to")}</Label>
          <Select
            value={values.destinationId || undefined}
            onValueChange={(destinationId) => update({ destinationId })}
          >
            <SelectTrigger id="route-destination" className="min-h-11 w-full">
              <SelectValue placeholder={t("to")} />
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
        <div className="space-y-2 md:min-w-[11rem]">
          <Label htmlFor="route-date">{t("date")}</Label>
          <Input
            id="route-date"
            type="date"
            value={values.date}
            onChange={(e) => update({ date: e.target.value })}
            className="min-h-11 w-full"
          />
        </div>
        <Button type="submit" className="min-h-11 w-full md:w-auto">
          <Search className="size-4" aria-hidden />
          {submitLabel ?? t("search")}
        </Button>
      </div>
    </form>
  );
}
