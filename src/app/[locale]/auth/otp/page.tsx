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
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("otpTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tDemo("otpHint")}</p>
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
            onChange={(e) => setCode(e.target.value)}
            className="min-h-11 tracking-widest"
            disabled={submitting}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="min-h-11 flex-1" disabled={submitting}>
            {submitting ? tCommon("loading") : t("verify")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={submitting}
            onClick={() => setCode(DEMO_OTP)}
          >
            {DEMO_OTP}
          </Button>
        </div>
      </form>

      <Button asChild variant="link" className="h-auto p-0 text-sm">
        <Link href="/auth/sign-in">{tCommon("back")}</Link>
      </Button>
    </div>
  );
}
