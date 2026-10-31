"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/i18n/navigation";
import {
  ApiClientError,
  listDemoPersonas,
  signInDemoAccount,
  signInWithPhone,
} from "@/lib/api";

type Persona = Awaited<ReturnType<typeof listDemoPersonas>>[number];

export default function SignInPage() {
  const t = useTranslations("auth");
  const tDemo = useTranslations("demo");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    listDemoPersonas()
      .then(setPersonas)
      .catch(() => {});
  }, []);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signInWithPhone(phone);
      router.push("/auth/otp");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePersona(userId: string) {
    if (!userId) return;
    setSubmitting(true);
    try {
      await signInDemoAccount(userId);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {t("signInTitle")}
        </h1>
        <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950/90">
          {t("demoNotice")}
        </p>
      </div>

      <form onSubmit={(e) => void handleSendOtp(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("phoneLabel")}</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="min-h-11"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
        </div>
        <Button type="submit" className="min-h-11 w-full" disabled={submitting}>
          {submitting ? tCommon("loading") : t("sendOtp")}
        </Button>
      </form>

      <div className="relative py-1">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
          {tDemo("useDemo")}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{t("personasTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tDemo("otpHint")}</p>
        </div>
        <ul className="space-y-2">
          {personas.map((p) => (
            <li key={p.userId}>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 w-full justify-start gap-3 whitespace-normal border-slate-200 py-2.5 text-left hover:border-emerald-200 hover:bg-emerald-50/40"
                disabled={submitting}
                onClick={() => void handlePersona(p.userId)}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                  {p.displayName.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-slate-900">
                    {p.displayName}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {p.phone} · {p.role}
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
