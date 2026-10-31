"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import { TripCard } from "@/components/shared/trip-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/navigation";
import {
  createShipment,
  getQuote,
  getShipment,
  getTrip,
  listHandoverPoints,
  listLocations,
  listTrips,
  transitionShipment,
  updateShipment,
} from "@/lib/api";
import { PARCEL_CATEGORIES, PARCEL_SIZES } from "@/lib/constants";
import { toastApiError } from "@/lib/toast-api";
import type {
  HandoverPoint,
  Locale,
  Location,
  Quote,
  TripWithDetails,
} from "@/lib/types";
import {
  formatBdt,
  isValidBdPhone,
  normalizeDigits,
  normalizePhone,
  tLocal,
} from "@/lib/utils";

const STEPS = ["route", "parcel", "receiver", "match", "quote", "review"] as const;

const routeStepSchema = z
  .object({
    originId: z.string().min(1),
    destinationId: z.string().min(1),
  })
  .refine((v) => v.originId !== v.destinationId, {
    message: "Origin and destination must differ",
    path: ["destinationId"],
  });

const parcelStepSchema = z.object({
  category: z.enum([
    "documents",
    "clothes",
    "electronics",
    "food_dry",
    "gifts",
    "other",
  ]),
  description: z.string().min(3),
  weightKg: z.number().min(0.1).max(30),
  size: z.enum(["small", "medium", "large"]),
  declaredValueMinor: z.number().min(0),
});

const receiverStepSchema = z.object({
  receiverName: z.string().min(2),
  receiverPhone: z.string().refine(isValidBdPhone, "Invalid phone"),
  isSenderReceiver: z.boolean(),
});

const matchStepSchema = z.object({
  tripId: z.string().min(1),
});

const wizardSchema = z.object({
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  handoverPointId: z.string().optional(),
  tripId: z.string().optional(),
  category: z.enum([
    "documents",
    "clothes",
    "electronics",
    "food_dry",
    "gifts",
    "other",
  ]),
  description: z.string().min(3),
  weightKg: z.number().min(0.1).max(30),
  size: z.enum(["small", "medium", "large"]),
  declaredValueMinor: z.number().min(0),
  receiverName: z.string().min(2),
  receiverPhone: z.string().refine(isValidBdPhone, "Invalid phone"),
  isSenderReceiver: z.boolean(),
});

type WizardValues = z.infer<typeof wizardSchema>;

type Props = {
  initialTripId?: string;
  draftId?: string;
};

export function CreateShipmentWizard({ initialTripId, draftId }: Props) {
  const t = useTranslations("shipment");
  const tCommon = useTranslations("common");
  const tParcel = useTranslations("parcel");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [step, setStep] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [handoverPoints, setHandoverPoints] = useState<HandoverPoint[]>([]);
  const [matchingTrips, setMatchingTrips] = useState<TripWithDetails[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [existingDraftId, setExistingDraftId] = useState<string | undefined>(
    draftId
  );
  const [busy, setBusy] = useState(false);

  const form = useForm<WizardValues>({
    mode: "onSubmit",
    defaultValues: {
      originId: "",
      destinationId: "",
      handoverPointId: "",
      tripId: initialTripId ?? "",
      category: "documents",
      description: "",
      weightKg: 1,
      size: "small",
      declaredValueMinor: 0,
      receiverName: "",
      receiverPhone: "",
      isSenderReceiver: false,
    },
  });

  const loadDraft = useCallback(async () => {
    if (!draftId) return;
    try {
      const s = await getShipment(draftId);
      if (s.status !== "draft") {
        toast.error(tCommon("error"));
        return;
      }
      form.reset({
        originId: s.originId,
        destinationId: s.destinationId,
        handoverPointId: s.handoverPointId ?? "",
        tripId: s.tripId ?? "",
        category: s.parcel.category,
        description: s.parcel.description,
        weightKg: s.parcel.weightKg,
        size: s.parcel.size,
        declaredValueMinor: s.parcel.declaredValueMinor,
        receiverName: s.receiverName,
        receiverPhone: s.receiverPhone,
        isSenderReceiver: s.isSenderReceiver,
      });
      setExistingDraftId(s.id);
    } catch (e) {
      toastApiError(e);
    }
  }, [draftId, form, tCommon]);

  useEffect(() => {
    void listLocations().then(setLocations);
    void loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    if (!initialTripId || draftId) return;
    void (async () => {
      try {
        const trip = await getTrip(initialTripId);
        form.setValue("tripId", trip.id);
        form.setValue("originId", trip.originId);
        form.setValue("destinationId", trip.destinationId);
        if (trip.handoverPointIds[0]) {
          form.setValue("handoverPointId", trip.handoverPointIds[0]);
        }
      } catch {
        /* trip may be missing in demo */
      }
    })();
  }, [initialTripId, draftId, form]);

  const originId = form.watch("originId");
  const destinationId = form.watch("destinationId");
  const isSenderReceiver = form.watch("isSenderReceiver");

  useEffect(() => {
    if (!originId) {
      setHandoverPoints([]);
      return;
    }
    void listHandoverPoints(originId).then(setHandoverPoints);
  }, [originId]);

  useEffect(() => {
    if (isSenderReceiver && user) {
      form.setValue("receiverName", user.displayName);
      form.setValue("receiverPhone", user.phone);
    }
  }, [isSenderReceiver, user, form]);

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step]
  );

  const stepKey = STEPS[step];
  const stepLabel = t(`steps.${stepKey}` as "steps.route");

  function validateStep(): boolean {
    const values = form.getValues();
    form.clearErrors();

    const toNumber = (v: unknown) =>
      Number(normalizeDigits(String(v ?? "")));

    let issues: { path: PropertyKey[]; message: string }[] = [];

    if (stepKey === "route") {
      const result = routeStepSchema.safeParse(values);
      if (!result.success) issues = result.error.issues;
    } else if (stepKey === "parcel") {
      const result = parcelStepSchema.safeParse({
        ...values,
        weightKg: toNumber(values.weightKg),
        declaredValueMinor: toNumber(values.declaredValueMinor),
      });
      if (!result.success) {
        issues = result.error.issues;
      } else {
        form.setValue("weightKg", result.data.weightKg);
        form.setValue("declaredValueMinor", result.data.declaredValueMinor);
      }
    } else if (stepKey === "receiver") {
      const result = receiverStepSchema.safeParse({
        ...values,
        receiverPhone: normalizeDigits(values.receiverPhone),
      });
      if (!result.success) issues = result.error.issues;
    } else if (stepKey === "match") {
      const result = matchStepSchema.safeParse(values);
      if (!result.success) issues = result.error.issues;
    }

    if (issues.length) {
      for (const issue of issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          form.setError(key as keyof WizardValues, { message: issue.message });
        }
      }
      toast.error(issues[0]?.message ?? tCommon("required"));
      return false;
    }
    return true;
  }

  async function loadMatchingTrips() {
    const { originId: o, destinationId: d } = form.getValues();
    const res = await listTrips({
      originId: o,
      destinationId: d,
      pageSize: 20,
      sort: "departure_asc",
    });
    setMatchingTrips(res.items);
  }

  async function loadQuote() {
    const v = form.getValues();
    const q = await getQuote({
      originId: v.originId,
      destinationId: v.destinationId,
      weightKg: v.weightKg,
      size: v.size,
      declaredValueMinor: v.declaredValueMinor,
      tripId: v.tripId || undefined,
    });
    setQuote(q);
  }

  async function goNext() {
    if (!validateStep()) return;
    setBusy(true);
    try {
      if (stepKey === "receiver") {
        await loadMatchingTrips();
      }
      if (stepKey === "match") {
        await loadQuote();
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e) {
      toastApiError(e);
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function buildInput(asDraft: boolean) {
    const v = form.getValues();
    return {
      originId: v.originId,
      destinationId: v.destinationId,
      handoverPointId: v.handoverPointId || undefined,
      tripId: v.tripId || undefined,
      parcel: {
        category: v.category,
        description: v.description,
        weightKg: v.weightKg,
        size: v.size,
        declaredValueMinor: v.declaredValueMinor,
      },
      receiverName: v.receiverName,
      receiverPhone: normalizePhone(v.receiverPhone),
      isSenderReceiver: v.isSenderReceiver,
      asDraft,
    };
  }

  async function saveDraft() {
    setBusy(true);
    try {
      if (existingDraftId) {
        const v = form.getValues();
        await updateShipment(existingDraftId, {
          originId: v.originId,
          destinationId: v.destinationId,
          handoverPointId: v.handoverPointId || undefined,
          tripId: v.tripId || undefined,
          parcel: {
            category: v.category,
            description: v.description,
            weightKg: v.weightKg,
            size: v.size,
            declaredValueMinor: v.declaredValueMinor,
          },
          receiverName: v.receiverName,
          receiverPhone: normalizePhone(v.receiverPhone),
          isSenderReceiver: v.isSenderReceiver,
        });
      } else {
        const created = await createShipment(buildInput(true));
        setExistingDraftId(created.id);
      }
      toast.success(t("draftSaved"));
      await refresh();
    } catch (e) {
      toastApiError(e);
    } finally {
      setBusy(false);
    }
  }

  async function submitFinal() {
    const parsed = wizardSchema.safeParse(form.getValues());
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          form.setError(key as keyof WizardValues, { message: issue.message });
        }
      }
      toast.error(parsed.error.issues[0]?.message ?? tCommon("required"));
      return;
    }

    setBusy(true);
    try {
      let shipmentId = existingDraftId;
      if (existingDraftId) {
        const v = parsed.data;
        await updateShipment(existingDraftId, {
          originId: v.originId,
          destinationId: v.destinationId,
          handoverPointId: v.handoverPointId || undefined,
          tripId: v.tripId || undefined,
          parcel: {
            category: v.category,
            description: v.description,
            weightKg: v.weightKg,
            size: v.size,
            declaredValueMinor: v.declaredValueMinor,
          },
          receiverName: v.receiverName,
          receiverPhone: normalizePhone(v.receiverPhone),
          isSenderReceiver: v.isSenderReceiver,
        });
        await transitionShipment(existingDraftId, "requested");
      } else {
        const created = await createShipment(buildInput(false));
        shipmentId = created.id;
      }
      toast.success(tCommon("submit"));
      router.push(`/shipments/${shipmentId}`);
    } catch (e) {
      toastApiError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-800">{stepLabel}</span>
          <span className="text-muted-foreground">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {stepKey === "route" ? (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>{tCommon("from")}</Label>
            <Select
              value={originId}
              onValueChange={(v) =>
                form.setValue("originId", v, { shouldDirty: true })
              }
            >
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {tLocal(loc.name, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.originId ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.originId.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>{tCommon("to")}</Label>
            <Select
              value={destinationId}
              onValueChange={(v) =>
                form.setValue("destinationId", v, { shouldDirty: true })
              }
            >
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {tLocal(loc.name, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.destinationId ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.destinationId.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>{t("handoverPoint")}</Label>
            <Select
              value={form.watch("handoverPointId") || undefined}
              onValueChange={(v) => form.setValue("handoverPointId", v)}
            >
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder={tCommon("optional")} />
              </SelectTrigger>
              <SelectContent>
                {handoverPoints.map((hp) => (
                  <SelectItem key={hp.id} value={hp.id}>
                    {tLocal(hp.name, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {stepKey === "parcel" ? (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>{tParcel("categoryLabel")}</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(v) =>
                form.setValue("category", v as WizardValues["category"])
              }
            >
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARCEL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {tParcel(`category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{tParcel("description")}</Label>
            <Textarea rows={3} {...form.register("description")} />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{tCommon("weight")} (kg)</Label>
              <Input
                inputMode="decimal"
                className="min-h-11"
                {...form.register("weightKg", {
                  setValueAs: (v) => Number(normalizeDigits(String(v))),
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>{tParcel("sizeLabel")}</Label>
              <Select
                value={form.watch("size")}
                onValueChange={(v) =>
                  form.setValue("size", v as WizardValues["size"])
                }
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARCEL_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tParcel(`size.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{tParcel("declaredValue")} (poisha)</Label>
            <Input
              inputMode="numeric"
              className="min-h-11"
              {...form.register("declaredValueMinor", {
                setValueAs: (v) => Number(normalizeDigits(String(v))),
              })}
            />
          </div>
        </div>
      ) : null}

      {stepKey === "receiver" ? (
        <div className="grid gap-4">
          <label className="flex min-h-11 items-center gap-3">
            <Checkbox
              checked={isSenderReceiver}
              onCheckedChange={(c) =>
                form.setValue("isSenderReceiver", c === true)
              }
            />
            <span className="text-sm font-medium">{t("iAmReceiver")}</span>
          </label>
          <div className="space-y-2">
            <Label>{t("receiverName")}</Label>
            <Input
              className="min-h-11"
              disabled={isSenderReceiver}
              {...form.register("receiverName")}
            />
            {form.formState.errors.receiverName ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.receiverName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>{t("receiverPhone")}</Label>
            <Input
              className="min-h-11"
              disabled={isSenderReceiver}
              placeholder="+8801XXXXXXXXX"
              {...form.register("receiverPhone")}
            />
            {form.formState.errors.receiverPhone ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.receiverPhone.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {stepKey === "match" ? (
        <div className="space-y-4">
          {matchingTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          ) : (
            matchingTrips.map((trip) => {
              const selected = form.watch("tripId") === trip.id;
              return (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  interactive={false}
                  selected={selected}
                  onSelect={() => form.setValue("tripId", trip.id)}
                />
              );
            })
          )}
          {form.formState.errors.tripId ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.tripId.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {stepKey === "quote" && quote ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="font-semibold text-slate-900">
            {formatBdt(quote.totalMinor, locale)}
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            {quote.lines.map((line) => (
              <li key={line.code} className="flex justify-between gap-2">
                <span>{tLocal(line.label, locale)}</span>
                <span>{formatBdt(line.amountMinor, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stepKey === "review" ? (
        <div className="space-y-2 rounded-lg border border-border p-4 text-sm text-slate-700">
          <p>
            {tLocal(
              locations.find((l) => l.id === originId)?.name ?? {
                bn: "",
                en: "",
              },
              locale
            )}{" "}
            →{" "}
            {tLocal(
              locations.find((l) => l.id === destinationId)?.name ?? {
                bn: "",
                en: "",
              },
              locale
            )}
          </p>
          <p>{form.watch("description")}</p>
          {quote ? (
            <p className="font-medium">{formatBdt(quote.totalMinor, locale)}</p>
          ) : null}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 p-4 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={goBack}
              disabled={busy}
            >
              {tCommon("back")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 flex-1 sm:flex-none"
            onClick={() => void saveDraft()}
            disabled={busy}
          >
            {tCommon("save")}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => void goNext()}
              disabled={busy}
            >
              {tCommon("next")}
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => void submitFinal()}
              disabled={busy}
            >
              {tCommon("submit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
