import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";

export default async function SafetyPage() {
  const t = await getTranslations("safety");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-start gap-3">
        <ShieldAlert className="size-7 shrink-0 text-emerald-700" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        </div>
      </div>

      <Card className="mt-8 border-red-100">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed text-slate-700">{t("prohibited")}</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed text-slate-700">{t("tips")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
