"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type {
  PaymentStatus,
  PayoutStatus,
  ShipmentStatus,
  TripStatus,
} from "@/lib/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export type StatusDomain =
  | "shipment"
  | "trip"
  | "payment"
  | "payout"
  | "auto";

type AnyStatus =
  | ShipmentStatus
  | TripStatus
  | PaymentStatus
  | PayoutStatus
  | string;

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function resolveShipmentVariant(
  status: ShipmentStatus
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "delivered":
      return "success";
    case "draft":
    case "requested":
      return "secondary";
    case "accepted":
    case "confirmed":
      return "default";
    case "picked_up":
    case "in_transit":
    case "ready_for_handover":
      return "warning";
    case "rejected":
    case "cancelled":
    case "delivery_failed":
      return "danger";
    case "returned":
      return "outline";
    default:
      return "secondary";
  }
}

function resolveTripVariant(
  status: TripStatus
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "completed":
      return "success";
    case "open":
    case "in_progress":
      return "default";
    case "full":
      return "warning";
    case "draft":
      return "secondary";
    case "cancelled":
      return "danger";
    default:
      return "secondary";
  }
}

function resolvePaymentVariant(
  status: PaymentStatus
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "unpaid":
      return "secondary";
    case "refunded":
      return "outline";
    case "failed":
      return "danger";
    default:
      return "secondary";
  }
}

function resolvePayoutVariant(
  status: PayoutStatus
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "processing":
      return "default";
    case "failed":
      return "danger";
    default:
      return "secondary";
  }
}

function inferDomain(status: string): Exclude<StatusDomain, "auto"> | null {
  const shipment: ShipmentStatus[] = [
    "draft",
    "requested",
    "accepted",
    "confirmed",
    "picked_up",
    "in_transit",
    "ready_for_handover",
    "delivered",
    "rejected",
    "cancelled",
    "delivery_failed",
    "returned",
  ];
  if (shipment.includes(status as ShipmentStatus)) return "shipment";

  const trip: TripStatus[] = [
    "draft",
    "open",
    "full",
    "in_progress",
    "completed",
    "cancelled",
  ];
  if (trip.includes(status as TripStatus)) return "trip";

  const payment: PaymentStatus[] = [
    "unpaid",
    "pending",
    "paid",
    "refunded",
    "failed",
  ];
  if (payment.includes(status as PaymentStatus)) return "payment";

  const payout: PayoutStatus[] = [
    "pending",
    "processing",
    "completed",
    "failed",
  ];
  if (payout.includes(status as PayoutStatus)) return "payout";

  return null;
}

function resolveVariant(
  status: AnyStatus,
  type: StatusDomain
): NonNullable<BadgeProps["variant"]> {
  const domain = type === "auto" ? inferDomain(status) : type;

  switch (domain) {
    case "shipment":
      return resolveShipmentVariant(status as ShipmentStatus);
    case "trip":
      return resolveTripVariant(status as TripStatus);
    case "payment":
      return resolvePaymentVariant(status as PaymentStatus);
    case "payout":
      return resolvePayoutVariant(status as PayoutStatus);
    default:
      if (status === "pending") return "warning";
      if (status === "completed" || status === "delivered" || status === "paid")
        return "success";
      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "rejected"
      )
        return "danger";
      return "secondary";
  }
}

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: AnyStatus;
  type?: StatusDomain;
  label?: string;
}

function StatusBadge({
  status,
  type = "auto",
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const domain = type === "auto" ? inferDomain(String(status)) : type;
  const tShipment = useTranslations("status.shipment");
  const tTrip = useTranslations("status.trip");
  const tPayment = useTranslations("status.payment");
  const tPayout = useTranslations("status.payout");

  let translated = formatStatusLabel(String(status));
  try {
    if (!label && domain === "shipment") translated = tShipment(status as ShipmentStatus);
    if (!label && domain === "trip") translated = tTrip(status as TripStatus);
    if (!label && domain === "payment") translated = tPayment(status as PaymentStatus);
    if (!label && domain === "payout") translated = tPayout(status as PayoutStatus);
  } catch {
    /* fall back to formatted status */
  }

  const variant = resolveVariant(status, type);
  const displayLabel = label ?? translated;

  return (
    <Badge variant={variant} className={cn(className)} {...props}>
      {displayLabel}
    </Badge>
  );
}

export { StatusBadge, formatStatusLabel };
