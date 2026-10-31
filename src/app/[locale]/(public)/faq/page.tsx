import { getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FaqItem = { q: string; a: string };

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const items = t.raw("items") as FaqItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>

      <div className="mt-8 space-y-4">
        {items.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                {item.q}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
