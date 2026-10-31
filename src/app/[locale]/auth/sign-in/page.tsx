"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("signInTitle")}</h1>
        <p className="mt-2 text-sm text-amber-900">{t("demoNotice")}</p>
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

      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium text-slate-800">{t("personasTitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{tDemo("otpHint")}</p>
        <ul className="mt-3 space-y-2">
          {personas.map((p) => (
            <li key={p.userId}>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 h-auto w-full justify-start whitespace-normal py-2 text-left"
                disabled={submitting}
                onClick={() => void handlePersona(p.userId)}
              >
                <span className="block font-medium">{p.displayName}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {p.role}
                </span>
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          className="mt-3 min-h-11 w-full"
          disabled={submitting}
          onClick={() => void handlePersona(personas[0]?.userId ?? "")}
        >
          {tDemo("useDemo")}
        </Button>
      </div>
    </div>
  );
}
