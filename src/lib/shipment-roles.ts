import type { ShipmentWithDetails, User } from "@/lib/types";

export function getShipmentRoles(user: User, shipment: ShipmentWithDetails) {
  const isSender = shipment.senderId === user.id;
  const isReceiver =
    shipment.receiverId === user.id ||
    shipment.receiverPhone === user.phone;
  const isTraveler = shipment.trip?.travelerId === user.id;
  return { isSender, isReceiver, isTraveler };
}
