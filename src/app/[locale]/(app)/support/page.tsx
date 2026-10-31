"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  subject: z.string().min(3),
  shipmentId: z.string().optional(),
  message: z.string().min(10),
  contact: z.string().min(3),
});

type FormValues = z.infer<typeof schema>;

function SupportForm() {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const presetShipment = searchParams.get("shipmentId") ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      subject: "",
      shipmentId: presetShipment,
      message: "",
      contact: "",
    },
  });

  return (
    <AppPage title={t("title")}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(() => {
          toast.success(tCommon("submit"));
          form.reset({
            subject: "",
            shipmentId: presetShipment,
            message: "",
            contact: "",
          });
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="subject">{t("form.subject")}</Label>
          <Input id="subject" className="min-h-11" {...form.register("subject")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shipmentId">{t("form.shipmentId")}</Label>
          <Input id="shipmentId" className="min-h-11" {...form.register("shipmentId")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">{t("form.message")}</Label>
          <Textarea id="message" rows={5} {...form.register("message")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact">{t("form.contact")}</Label>
          <Input id="contact" className="min-h-11" {...form.register("contact")} />
        </div>
        <Button type="submit" className="min-h-11 w-full sm:w-auto">
          {t("submit")}
        </Button>
      </form>
    </AppPage>
  );
}

export default function SupportPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-4 py-8">
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <SupportForm />
      </Suspense>
    </AuthGate>
  );
}
