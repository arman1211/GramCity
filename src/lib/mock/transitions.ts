import type { ShipmentStatus } from "@/lib/types";

/** Valid next statuses from each shipment state (mock service guard). */
export const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  draft: ["requested", "cancelled"],
  requested: ["accepted", "rejected", "cancelled"],
  accepted: ["confirmed", "cancelled"],
  confirmed: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "delivery_failed", "cancelled"],
  in_transit: ["ready_for_handover", "delivery_failed"],
  ready_for_handover: ["delivered", "delivery_failed"],
  delivered: [],
  rejected: [],
  cancelled: [],
  delivery_failed: ["returned", "ready_for_handover", "cancelled"],
  returned: [],
};

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}
