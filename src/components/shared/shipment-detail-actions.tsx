"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { StickyActions } from "@/components/shared/sticky-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import {
  acceptShipment,
  cancelShipment,
  confirmDelivery,
  rejectShipment,
  sendMessage,
  transitionShipment,
} from "@/lib/api";
import { canTransition } from "@/lib/mock/transitions";
import { getShipmentRoles } from "@/lib/shipment-roles";
import { toastApiError } from "@/lib/toast-api";
import type { ShipmentWithDetails, User } from "@/lib/types";

type Props = {
  shipment: ShipmentWithDetails;
  user: User;
  onUpdated: () => void;
};

export function ShipmentDetailActions({ shipment, user, onUpdated }: Props) {
  const t = useTranslations("shipment");
  const tRec = useTranslations("receiving");
  const tCarry = useTranslations("carrying");
  const tTrips = useTranslations("myTrips");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const { isSender, isReceiver, isTraveler } = getShipmentRoles(user, shipment);
  const status = shipment.status;

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      onUpdated();
    } catch (e) {
      toastApiError(e);
    } finally {
      setBusy(false);
    }
  }

  async function receiverStub(messageKey: string) {
    await run(() =>
      sendMessage(
        shipment.id,
        `[Demo] ${messageKey} — ${new Date().toISOString()}`
      )
    );
  }

  const actions: ReactNode[] = [];

  if (isSender && status === "draft") {
    actions.push(
      <Button key="edit" asChild variant="outline" className="min-h-11">
        <Link href={`/shipments/new?draftId=${shipment.id}`}>{tCommon("edit")}</Link>
      </Button>
    );
    if (canTransition(status, "requested") && shipment.tripId) {
      actions.push(
        <Button
          key="submit"
          className="min-h-11"
          disabled={busy}
          onClick={() =>
            run(() => transitionShipment(shipment.id, "requested"), tCommon("submit"))
          }
        >
          {tCommon("submit")}
        </Button>
      );
    }
  }

  if (isSender && canTransition(status, "cancelled")) {
    actions.push(
      <Button
        key="cancel"
        variant="destructive"
        className="min-h-11"
        disabled={busy}
        onClick={() => run(() => cancelShipment(shipment.id))}
      >
        {t("cancel")}
      </Button>
    );
  }

  if (shipment.trip && (isSender || isReceiver)) {
    actions.push(
      <Button key="traveler" asChild variant="outline" className="min-h-11">
        <Link href={`/trips/${shipment.trip.id}`}>{t("steps.match")}</Link>
      </Button>
    );
  }

  actions.push(
    <Button key="messages" asChild variant="outline" className="min-h-11">
      <Link href={`/messages/${shipment.id}`}>Messages</Link>
    </Button>
  );

  if (isTraveler && status === "requested") {
    actions.push(
      <Button
        key="accept"
        className="min-h-11"
        disabled={busy}
        onClick={() => run(() => acceptShipment(shipment.id), tTrips("accept"))}
      >
        {tTrips("accept")}
      </Button>,
      <Button
        key="reject"
        variant="outline"
        className="min-h-11"
        disabled={busy}
        onClick={() => run(() => rejectShipment(shipment.id), tTrips("reject"))}
      >
        {tTrips("reject")}
      </Button>
    );
  }

  if (isTraveler && canTransition(status, "confirmed")) {
    actions.push(
      <Button
        key="confirm"
        className="min-h-11"
        disabled={busy}
        onClick={() =>
          run(() => transitionShipment(shipment.id, "confirmed"), tCommon("confirm"))
        }
      >
        {tCommon("confirm")}
      </Button>
    );
  }

  if (isTraveler && canTransition(status, "picked_up")) {
    actions.push(
      <Button
        key="pickup"
        className="min-h-11"
        disabled={busy}
        onClick={() =>
          run(() => transitionShipment(shipment.id, "picked_up"), tCarry("markPickedUp"))
        }
      >
        {tCarry("markPickedUp")}
      </Button>
    );
  }

  if (isTraveler && canTransition(status, "in_transit")) {
    actions.push(
      <Button
        key="transit"
        className="min-h-11"
        disabled={busy}
        onClick={() =>
          run(() => transitionShipment(shipment.id, "in_transit"), tCarry("markInTransit"))
        }
      >
        {tCarry("markInTransit")}
      </Button>
    );
  }

  if (isTraveler && canTransition(status, "ready_for_handover")) {
    actions.push(
      <Button
        key="ready"
        className="min-h-11"
        disabled={busy}
        onClick={() =>
          run(
            () => transitionShipment(shipment.id, "ready_for_handover"),
            tCarry("markReady")
          )
        }
      >
        {tCarry("markReady")}
      </Button>
    );
  }

  if (isReceiver && !["delivered", "cancelled", "rejected"].includes(status)) {
    actions.push(
      <Button
        key="ack"
        variant="secondary"
        className="min-h-11"
        disabled={busy}
        onClick={() => void receiverStub(tRec("acknowledge"))}
      >
        {tRec("acknowledge")}
      </Button>,
      <Button
        key="avail"
        variant="secondary"
        className="min-h-11"
        disabled={busy}
        onClick={() => void receiverStub(tRec("confirmAvailability"))}
      >
        {tRec("confirmAvailability")}
      </Button>
    );
  }

  if (
    isReceiver &&
    (status === "ready_for_handover" || status === "in_transit")
  ) {
    actions.push(
      <Button
        key="receipt"
        className="min-h-11"
        disabled={busy}
        onClick={() => setCodeOpen(true)}
      >
        {tRec("confirmReceipt")}
      </Button>
    );
  }

  if (isReceiver) {
    actions.push(
      <Button key="issue" asChild variant="outline" className="min-h-11">
        <Link href={`/support?shipmentId=${shipment.id}`}>{tRec("reportIssue")}</Link>
      </Button>
    );
  }

  if (
    isTraveler &&
    (status === "ready_for_handover" || status === "in_transit")
  ) {
    actions.push(
      <Button
        key="complete"
        className="min-h-11"
        disabled={busy}
        onClick={() => setCodeOpen(true)}
      >
        {tCarry("completeDelivery")}
      </Button>
    );
  }

  actions.push(
    <Button key="support" asChild variant="ghost" className="min-h-11">
      <Link href="/support">{t("contactSupport")}</Link>
    </Button>
  );

  if (actions.length === 0) return null;

  return (
    <>
      <StickyActions>{actions}</StickyActions>
      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tRec("enterCode")}</DialogTitle>
          </DialogHeader>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="min-h-11"
            inputMode="numeric"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCodeOpen(false)}>
              {tCommon("close")}
            </Button>
            <Button
              disabled={busy || !code.trim()}
              onClick={() =>
                run(async () => {
                  await confirmDelivery(shipment.id, code);
                  setCodeOpen(false);
                  setCode("");
                  router.refresh();
                }, tRec("confirmReceipt"))
              }
            >
              {tCommon("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
