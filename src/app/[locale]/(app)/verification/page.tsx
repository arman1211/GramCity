"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function VerificationPage() {
  return (
    <AuthGate>
      <VerificationContent />
    </AuthGate>
  );
}

function VerificationContent() {
  const t = useTranslations("verification");
  const tCommon = useTranslations("common");
  const steps = t.raw("steps") as string[];

  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const progress = ((step + 1) / (steps.length + 1)) * 100;

  return (
    <AppPage title={t("title")} description={t("demoNotice")}>
      <Progress value={progress} className="mb-6 h-2" />

      {step === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">{steps[0]}</p>
          <div className="space-y-2">
            <Label htmlFor="phone">{tCommon("demoOnly")}</Label>
            <Input id="phone" disabled value="+8801XXXXXXXXX" className="min-h-11" />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">{steps[1]}</p>
          <Input type="file" disabled className="min-h-11" />
          <p className="text-xs text-muted-foreground">{t("demoNotice")}</p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">{steps[2]}</p>
          <label className="flex min-h-11 items-center gap-3">
            <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} />
            <span className="text-sm">{t("demoNotice")}</span>
          </label>
        </div>
      ) : null}

      {step >= steps.length ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {tCommon("demoOnly")}: simulated approval recorded locally.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {step > 0 && step < steps.length ? (
          <Button variant="outline" className="min-h-11" onClick={() => setStep((s) => s - 1)}>
            {tCommon("back")}
          </Button>
        ) : null}
        {step < steps.length ? (
          <Button
            className="min-h-11"
            disabled={step === 2 && !agreed}
            onClick={() => setStep((s) => s + 1)}
          >
            {tCommon("next")}
          </Button>
        ) : (
          <Button
            className="min-h-11"
            onClick={() => toast.success(t("title"))}
          >
            {tCommon("submit")}
          </Button>
        )}
      </div>
    </AppPage>
  );
}
