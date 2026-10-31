"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listHandoverPoints, listLocations } from "@/lib/api";
import { PARCEL_CATEGORIES } from "@/lib/constants";
import type { CreateTripInput, HandoverPoint, Locale, Location } from "@/lib/types";
import { normalizeDigits, tLocal } from "@/lib/utils";

const tripSchema = z.object({
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  handoverPointIds: z.array(z.string()).min(1),
  departureAt: z.string().min(1),
  arrivalWindowStart: z.string().min(1),
  arrivalWindowEnd: z.string().min(1),
  capacityKg: z.number().min(1).max(50),
  pricePerKgMinor: z.number().min(100),
  acceptedParcelTypes: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

export type TripFormValues = z.infer<typeof tripSchema>;

type TripFormProps = {
  defaultValues?: Partial<TripFormValues>;
  submitLabel: string;
  onSubmit: (values: CreateTripInput) => Promise<void>;
  disabled?: boolean;
};

export function TripForm({
  defaultValues,
  submitLabel,
  onSubmit,
  disabled,
}: TripFormProps) {
  const t = useTranslations("myTrips");
  const tParcel = useTranslations("parcel.category");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;

  const [locations, setLocations] = useState<Location[]>([]);
  const [handoverPoints, setHandoverPoints] = useState<HandoverPoint[]>([]);

  const form = useForm<TripFormValues>({
    // Zod 4 + resolvers input/output types diverge on numeric fields; cast is safe here.
    resolver: zodResolver(tripSchema) as never,
    defaultValues: {
      originId: "",
      destinationId: "",
      handoverPointIds: [],
      departureAt: "",
      arrivalWindowStart: "",
      arrivalWindowEnd: "",
      capacityKg: 5,
      pricePerKgMinor: 8000,
      acceptedParcelTypes: [...PARCEL_CATEGORIES],
      notes: "",
      ...defaultValues,
    },
  });

  const originId = form.watch("originId");
  const selectedHandover = form.watch("handoverPointIds");

  useEffect(() => {
    void listLocations().then(setLocations);
  }, []);

  useEffect(() => {
    if (!originId) {
      setHandoverPoints([]);
      return;
    }
    void listHandoverPoints(originId).then(setHandoverPoints);
  }, [originId]);

  const toggleHandover = (id: string) => {
    const next = selectedHandover.includes(id)
      ? selectedHandover.filter((h) => h !== id)
      : [...selectedHandover, id];
    form.setValue("handoverPointIds", next, { shouldValidate: true });
  };

  const toggleParcelType = (cat: string) => {
    const current = form.watch("acceptedParcelTypes");
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    form.setValue("acceptedParcelTypes", next, { shouldValidate: true });
  };

  return (
    <form
      className="space-y-6 pb-24 md:pb-0"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          pricePerKgMinor: Math.round(values.pricePerKgMinor),
          acceptedParcelTypes: values.acceptedParcelTypes as CreateTripInput["acceptedParcelTypes"],
        });
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="originId">{tCommon("from")}</Label>
          <Select
            value={form.watch("originId")}
            onValueChange={(v) => {
              form.setValue("originId", v);
              form.setValue("handoverPointIds", []);
            }}
          >
            <SelectTrigger id="originId" className="min-h-11">
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
          <Label htmlFor="destinationId">{tCommon("to")}</Label>
          <Select
            value={form.watch("destinationId")}
            onValueChange={(v) => form.setValue("destinationId", v)}
          >
            <SelectTrigger id="destinationId" className="min-h-11">
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

      <div className="space-y-2">
        <Label>{t("remainingCapacity")} / handover</Label>
        <div className="space-y-2 rounded-md border border-border p-3">
          {handoverPoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("optional")}</p>
          ) : (
            handoverPoints.map((hp) => (
              <label
                key={hp.id}
                className="flex min-h-11 cursor-pointer items-start gap-3"
              >
                <Checkbox
                  checked={selectedHandover.includes(hp.id)}
                  onCheckedChange={() => toggleHandover(hp.id)}
                />
                <span className="text-sm">
                  {tLocal(hp.name, locale)} — {tLocal(hp.address, locale)}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="departureAt">Departure</Label>
          <Input
            id="departureAt"
            type="datetime-local"
            className="min-h-11"
            {...form.register("departureAt")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacityKg">{tCommon("weight")} (kg max)</Label>
          <Input
            id="capacityKg"
            inputMode="decimal"
            className="min-h-11"
            {...form.register("capacityKg", {
              setValueAs: (v) => Number(normalizeDigits(String(v))),
            })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="arrivalWindowStart">Arrival from</Label>
          <Input
            id="arrivalWindowStart"
            type="datetime-local"
            className="min-h-11"
            {...form.register("arrivalWindowStart")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="arrivalWindowEnd">Arrival to</Label>
          <Input
            id="arrivalWindowEnd"
            type="datetime-local"
            className="min-h-11"
            {...form.register("arrivalWindowEnd")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricePerKgMinor">{tCommon("price")} (poisha/kg)</Label>
        <Input
          id="pricePerKgMinor"
          inputMode="numeric"
          className="min-h-11"
          {...form.register("pricePerKgMinor", {
            setValueAs: (v) => Number(normalizeDigits(String(v))),
          })}
        />
      </div>

      <div className="space-y-2">
        <Label>Parcel types</Label>
        <div className="flex flex-wrap gap-2">
          {PARCEL_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={
                form.watch("acceptedParcelTypes").includes(cat)
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="min-h-9"
              onClick={() => toggleParcelType(cat)}
            >
              {tParcel(cat)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{tCommon("optional")}</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>

      <Button
        type="submit"
        className="min-h-11 w-full sm:w-auto"
        disabled={disabled || form.formState.isSubmitting}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
