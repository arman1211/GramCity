"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError, verifyOtp } from "@/lib/api";

const DEMO_OTP = "123456";

export default function OtpPage() {
  const t = useTranslations("auth");
  const tDemo = useTranslations("demo");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyOtp(code.trim());
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
          {t("otpTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{tDemo("otpHint")}</p>
      </div>

      <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">{t("otpLabel")}</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="min-h-12 text-center text-2xl tracking-[0.35em] font-semibold"
            disabled={submitting}
            placeholder="••••••"
          />
        </div>
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={submitting || code.length < 6}
        >
          {submitting ? tCommon("loading") : t("verify")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full"
          disabled={submitting}
          onClick={() => setCode(DEMO_OTP)}
        >
          {tDemo("useDemo")}: {DEMO_OTP}
        </Button>
      </form>

      <Button asChild variant="link" className="h-auto p-0 text-sm text-emerald-800">
        <Link href="/auth/sign-in">{tCommon("back")}</Link>
      </Button>
    </div>
  );
}
