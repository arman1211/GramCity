"use client";

import type { ReactNode } from "react";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<LogIn />}
        title={tAuth("signInTitle")}
        description={tAuth("demoNotice")}
        action={
          <Button asChild className="min-h-11">
            <Link href="/auth/sign-in">{t("signIn")}</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
