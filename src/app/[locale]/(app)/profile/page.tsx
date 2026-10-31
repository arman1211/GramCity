"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/navigation";
import {
  listDemoPersonas,
  resetDemoData,
  signOut,
  switchPersona,
} from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import { useAuth } from "@/hooks/use-auth";

type Persona = {
  userId: string;
  displayName: string;
  phone: string;
  role: string;
};

export default function ProfilePage() {
  return (
    <AuthGate>
      <ProfileContent />
    </AuthGate>
  );
}

function ProfileContent() {
  const t = useTranslations("profile");
  const tNav = useTranslations("nav");
  const tDemo = useTranslations("demo");
  const tAuth = useTranslations("auth");
  const { user, refresh } = useAuth();
  const router = useRouter();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listDemoPersonas().then(setPersonas).catch(toastApiError);
  }, []);

  if (!user) return null;

  return (
    <AppPage title={t("title")}>
      <Card>
        <CardHeader>
          <CardTitle>{user.displayName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>{user.phoneMasked}</p>
          <p>
            {user.isVerifiedTraveler ? tNav("verification") : tAuth("demoNotice")}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("preferences")}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">{t("language")}</span>
          <LanguageSwitcher />
        </div>
        <p className="text-xs text-muted-foreground">{tAuth("demoNotice")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {tAuth("personasTitle")}
        </h2>
        <Select
          value={user.id}
          onValueChange={(id) => {
            setBusy(true);
            void switchPersona(id)
              .then(() => refresh())
              .then(() => toast.success(tAuth("useDemo")))
              .catch(toastApiError)
              .finally(() => setBusy(false));
          }}
          disabled={busy}
        >
          <SelectTrigger className="min-h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personas.map((p) => (
              <SelectItem key={p.userId} value={p.userId}>
                {p.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/verification">{tNav("verification")}</Link>
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void resetDemoData()
              .then(() => refresh())
              .then(() => toast.success(tDemo("reset")))
              .catch(toastApiError)
              .finally(() => setBusy(false));
          }}
        >
          {t("resetDemo")}
        </Button>
        <Button
          variant="destructive"
          className="min-h-11"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void signOut()
              .then(() => router.push("/auth/sign-in"))
              .catch(toastApiError)
              .finally(() => setBusy(false));
          }}
        >
          {tNav("signOut")}
        </Button>
      </div>
    </AppPage>
  );
}
