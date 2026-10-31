import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HowItWorksPage() {
  const t = await getTranslations("how");

  const sendSteps = t.raw("sendSteps") as string[];
  const receiveSteps = t.raw("receiveSteps") as string[];
  const carrySteps = t.raw("carrySteps") as string[];

  const sections = [
    { title: t("sendTitle"), steps: sendSteps },
    { title: t("receiveTitle"), steps: receiveSteps },
    { title: t("carryTitle"), steps: carrySteps },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-2 text-slate-600">{t("subtitle")}</p>

      <div className="mt-8 space-y-6">
        {sections.map(({ title, steps }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
