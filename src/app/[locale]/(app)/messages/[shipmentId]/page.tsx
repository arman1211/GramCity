"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { AuthGate } from "@/components/shared/auth-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getShipment, listMessages, sendMessage } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api";
import type { Message, ShipmentWithDetails } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/types";

export default function MessageThreadPage() {
  return (
    <AuthGate>
      <MessageThreadContent />
    </AuthGate>
  );
}

function MessageThreadContent() {
  const params = useParams();
  const shipmentId = String(params.shipmentId);
  const t = useTranslations("messages");
  const locale = useLocale() as Locale;
  const { user } = useAuth();

  const [shipment, setShipment] = useState<ShipmentWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        getShipment(shipmentId),
        listMessages(shipmentId),
      ]);
      setShipment(s);
      setMessages(m);
    } catch (e) {
      toastApiError(e);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await sendMessage(shipmentId, body);
      setBody("");
      toast.success(t("send"));
      await load();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSending(false);
    }
  }

  if (loading || !shipment) {
    return (
      <AppPage title={t("title")}>
        <Skeleton className="h-40 w-full" />
      </AppPage>
    );
  }

  return (
    <AppPage title={shipment.trackingNumber}>
      <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-4">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      mine
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-slate-800"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {formatDateTime(m.createdAt, locale)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e) => void handleSend(e)} className="flex gap-2 pb-4">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("placeholder")}
            className="min-h-11 flex-1"
          />
          <Button type="submit" className="min-h-11" disabled={sending}>
            {t("send")}
          </Button>
        </form>
      </div>
    </AppPage>
  );
}
