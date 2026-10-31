import { canTransition } from "@/lib/mock/transitions";
import { getStore, resetStore, saveStore } from "@/lib/mock/store";
import { DEMO_OTP, DEMO_PERSONAS } from "@/lib/mock/seed";
import { throwApiError } from "@/lib/api/errors";
import {
  delay,
  isValidBdPhone,
  normalizePhone,
  uid,
} from "@/lib/utils";
import type {
  CreateShipmentInput,
  CreateTripInput,
  DemoStore,
  Earning,
  HandoverPoint,
  LocalizedString,
  Location,
  Message,
  NotificationItem,
  Paginated,
  ParcelSize,
  Quote,
  QuoteInput,
  QuoteLine,
  Review,
  Shipment,
  ShipmentStatus,
  ShipmentWithDetails,
  Trip,
  TripFilters,
  TripWithDetails,
  User,
  UserPublic,
} from "@/lib/types";

const PENDING_PHONE_KEY = "gramcity_pending_phone";
const DEFAULT_PRICE_PER_KG_MINOR = 8000;

const TIMELINE_LABELS: Record<ShipmentStatus, LocalizedString> = {
  draft: { bn: "খসড়া সংরক্ষিত", en: "Draft saved" },
  requested: { bn: "অনুরোধ পাঠানো", en: "Request sent" },
  accepted: { bn: "ভ্রমণকারী গ্রহণ করেছেন", en: "Accepted by traveler" },
  confirmed: { bn: "বুকিং নিশ্চিত", en: "Booking confirmed" },
  picked_up: { bn: "পার্সেল সংগ্রহ", en: "Parcel picked up" },
  in_transit: { bn: "পথে", en: "In transit" },
  ready_for_handover: {
    bn: "হস্তান্তরের জন্য প্রস্তুত",
    en: "Ready for handover",
  },
  delivered: { bn: "সফলভাবে বিতরণ", en: "Delivered" },
  rejected: { bn: "অনুরোধ প্রত্যাখ্যাত", en: "Request rejected" },
  cancelled: { bn: "বাতিল করা হয়েছে", en: "Cancelled" },
  delivery_failed: { bn: "ডেলিভারি ব্যর্থ", en: "Delivery failed" },
  returned: { bn: "প্রেরকের কাছে ফেরত", en: "Returned to sender" },
};

const CARRYING_STATUSES: ShipmentStatus[] = [
  "accepted",
  "confirmed",
  "picked_up",
  "in_transit",
  "ready_for_handover",
];

async function simulateLatency(): Promise<void> {
  await delay(200 + Math.floor(Math.random() * 401));
}

function nowIso(): string {
  return new Date().toISOString();
}

function mutateStore(mutator: (store: DemoStore) => void): DemoStore {
  const store = getStore();
  mutator(store);
  saveStore(store);
  return store;
}

function requireUser(store: DemoStore): User {
  if (!store.currentUserId) {
    throwApiError("UNAUTHORIZED", "Sign in to continue.");
  }
  const user = store.users.find((u) => u.id === store.currentUserId);
  if (!user) {
    throwApiError("UNAUTHORIZED", "Session expired. Sign in again.");
  }
  return user;
}

function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    displayName: user.displayName,
    phoneMasked: user.phoneMasked,
    avatarInitials: user.avatarInitials,
    isVerifiedTraveler: user.isVerifiedTraveler,
    ratingAvg: user.ratingAvg,
    ratingCount: user.ratingCount,
    tripsCompleted: user.tripsCompleted,
    memberSince: user.memberSince,
  };
}

function findLocation(store: DemoStore, id: string): Location {
  const loc = store.locations.find((l) => l.id === id);
  if (!loc) {
    throwApiError("NOT_FOUND", "Location not found.", { id });
  }
  return loc;
}

function findTrip(store: DemoStore, id: string): Trip {
  const trip = store.trips.find((t) => t.id === id);
  if (!trip) {
    throwApiError("NOT_FOUND", "Trip not found.", { id });
  }
  return trip;
}

function findShipment(store: DemoStore, id: string): Shipment {
  const shipment = store.shipments.find((s) => s.id === id);
  if (!shipment) {
    throwApiError("NOT_FOUND", "Shipment not found.", { id });
  }
  return shipment;
}

function enrichTrip(trip: Trip, store: DemoStore): TripWithDetails {
  const traveler = store.users.find((u) => u.id === trip.travelerId);
  if (!traveler) {
    throwApiError("NOT_FOUND", "Traveler not found.", { tripId: trip.id });
  }
  const origin = findLocation(store, trip.originId);
  const destination = findLocation(store, trip.destinationId);
  const handoverPoints = trip.handoverPointIds
    .map((hpId) => store.handoverPoints.find((hp) => hp.id === hpId))
    .filter((hp): hp is HandoverPoint => Boolean(hp));

  return {
    ...trip,
    traveler: toUserPublic(traveler),
    origin,
    destination,
    handoverPoints,
  };
}

function enrichShipment(shipment: Shipment, store: DemoStore): ShipmentWithDetails {
  const sender = store.users.find((u) => u.id === shipment.senderId);
  if (!sender) {
    throwApiError("NOT_FOUND", "Sender not found.", { shipmentId: shipment.id });
  }
  const receiver = shipment.receiverId
    ? store.users.find((u) => u.id === shipment.receiverId)
    : undefined;
  const trip = shipment.tripId
    ? enrichTrip(findTrip(store, shipment.tripId), store)
    : undefined;
  const origin = findLocation(store, shipment.originId);
  const destination = findLocation(store, shipment.destinationId);
  const handoverPoint = shipment.handoverPointId
    ? store.handoverPoints.find((hp) => hp.id === shipment.handoverPointId)
    : undefined;

  return {
    ...shipment,
    sender: toUserPublic(sender),
    receiver: receiver ? toUserPublic(receiver) : undefined,
    trip,
    origin,
    destination,
    handoverPoint,
  };
}

function haversineKm(a: Location, b: Location): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function sizeSurchargeMinor(size: ParcelSize): number {
  switch (size) {
    case "small":
      return 0;
    case "medium":
      return 5000;
    case "large":
      return 15000;
    default:
      return 0;
  }
}

function computeQuote(store: DemoStore, input: QuoteInput): Quote {
  const origin = findLocation(store, input.originId);
  const destination = findLocation(store, input.destinationId);
  const distanceKm = haversineKm(origin, destination);

  let pricePerKg = DEFAULT_PRICE_PER_KG_MINOR;
  if (input.tripId) {
    const trip = findTrip(store, input.tripId);
    pricePerKg = trip.pricePerKgMinor;
  }

  const baseRouteMinor = Math.round(5000 + distanceKm * 750);
  const weightMinor = Math.round(input.weightKg * pricePerKg);
  const sizeMinor = sizeSurchargeMinor(input.size);
  const declared = input.declaredValueMinor ?? 0;
  const insuranceMinor = Math.round(declared * 0.005);

  const lines: QuoteLine[] = [
    {
      code: "route_base",
      label: { bn: "রুট ফি", en: "Route fee" },
      amountMinor: baseRouteMinor,
    },
    {
      code: "weight",
      label: {
        bn: `${input.weightKg} কেজি × ${pricePerKg / 100} টাকা`,
        en: `${input.weightKg} kg × ${pricePerKg / 100} BDT`,
      },
      amountMinor: weightMinor,
    },
  ];

  if (sizeMinor > 0) {
    lines.push({
      code: "size",
      label: { bn: "আকার সারচার্জ", en: "Size surcharge" },
      amountMinor: sizeMinor,
    });
  }

  if (insuranceMinor > 0) {
    lines.push({
      code: "insurance",
      label: { bn: "ঘোষিত মূল্য বীমা (০.৫%)", en: "Declared value insurance (0.5%)" },
      amountMinor: insuranceMinor,
    });
  }

  const totalMinor = lines.reduce((sum, line) => sum + line.amountMinor, 0);

  return {
    routeLabel: {
      bn: `${origin.name.bn} → ${destination.name.bn}`,
      en: `${origin.name.en} → ${destination.name.en}`,
    },
    weightKg: input.weightKg,
    size: input.size,
    lines,
    totalMinor,
    currency: "BDT",
    isDemoEstimate: true,
  };
}

function generateTrackingNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return `GC-${suffix}`;
}

function generateDeliveryCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function resolveReceiverId(store: DemoStore, phone: string): string | undefined {
  const normalized = normalizePhone(phone);
  return store.users.find((u) => u.phone === normalized)?.id;
}

function appendTimelineEvent(
  shipment: Shipment,
  status: ShipmentStatus,
  actorId?: string,
): void {
  shipment.timeline.push({
    id: uid("tl"),
    status,
    label: TIMELINE_LABELS[status],
    at: nowIso(),
    actorId,
  });
}

function addNotification(
  store: DemoStore,
  userId: string,
  title: LocalizedString,
  body: LocalizedString,
  href?: string,
): void {
  const item: NotificationItem = {
    id: uid("notif"),
    userId,
    title,
    body,
    href,
    read: false,
    createdAt: nowIso(),
  };
  store.notifications.unshift(item);
}

function restoreTripCapacity(store: DemoStore, shipment: Shipment): void {
  if (!shipment.tripId) {
    return;
  }
  const trip = store.trips.find((t) => t.id === shipment.tripId);
  if (!trip) {
    return;
  }
  trip.remainingCapacityKg = Math.min(
    trip.capacityKg,
    trip.remainingCapacityKg + shipment.parcel.weightKg,
  );
  if (trip.status === "full" && trip.remainingCapacityKg > 0) {
    trip.status = "open";
  }
  trip.updatedAt = nowIso();
}

function decreaseTripCapacity(store: DemoStore, shipment: Shipment): void {
  if (!shipment.tripId) {
    return;
  }
  const trip = findTrip(store, shipment.tripId);
  if (trip.remainingCapacityKg < shipment.parcel.weightKg) {
    throwApiError("CAPACITY_EXCEEDED", "Trip does not have enough capacity.");
  }
  trip.remainingCapacityKg -= shipment.parcel.weightKg;
  if (trip.remainingCapacityKg <= 0) {
    trip.status = "full";
  }
  trip.updatedAt = nowIso();
}

// ——— Auth ———

export async function getCurrentUser(): Promise<User | null> {
  await simulateLatency();
  const store = getStore();
  if (!store.currentUserId) {
    return null;
  }
  return store.users.find((u) => u.id === store.currentUserId) ?? null;
}

export async function listDemoPersonas() {
  await simulateLatency();
  return DEMO_PERSONAS.map((p) => ({ ...p }));
}

export async function signInWithPhone(phone: string): Promise<{ ok: true }> {
  await simulateLatency();
  if (!isValidBdPhone(phone)) {
    throwApiError("VALIDATION_ERROR", "Enter a valid Bangladesh mobile number.", {
      field: "phone",
    });
  }
  const normalized = normalizePhone(phone);
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PENDING_PHONE_KEY, normalized);
  }
  return { ok: true };
}

export async function verifyOtp(code: string): Promise<User> {
  await simulateLatency();
  if (code !== DEMO_OTP) {
    throwApiError("INVALID_OTP", "Invalid verification code. Use demo OTP 123456.");
  }
  if (typeof window === "undefined") {
    throwApiError("VALIDATION_ERROR", "OTP verification requires a browser session.");
  }
  const pending = sessionStorage.getItem(PENDING_PHONE_KEY);
  if (!pending) {
    throwApiError("VALIDATION_ERROR", "No pending sign-in. Enter your phone first.");
  }
  const store = getStore();
  const user = store.users.find((u) => u.phone === pending);
  if (!user) {
    throwApiError(
      "NOT_FOUND",
      "No demo account for this number. Try a demo persona or register in demo mode.",
    );
  }
  mutateStore((s) => {
    s.currentUserId = user.id;
  });
  sessionStorage.removeItem(PENDING_PHONE_KEY);
  return user;
}

export async function signInDemoAccount(userId: string): Promise<User> {
  await simulateLatency();
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    throwApiError("NOT_FOUND", "Demo user not found.", { userId });
  }
  mutateStore((s) => {
    s.currentUserId = userId;
  });
  return user;
}

export async function switchPersona(userId: string): Promise<User> {
  return signInDemoAccount(userId);
}

export async function signOut(): Promise<void> {
  await simulateLatency();
  mutateStore((s) => {
    s.currentUserId = null;
  });
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(PENDING_PHONE_KEY);
  }
}

// ——— Catalog ———

export async function listLocations(): Promise<Location[]> {
  await simulateLatency();
  return [...getStore().locations];
}

export async function searchLocations(query: string): Promise<Location[]> {
  await simulateLatency();
  const q = query.trim().toLowerCase();
  if (!q) {
    return listLocations();
  }
  return getStore().locations.filter(
    (loc) =>
      loc.name.bn.toLowerCase().includes(q) ||
      loc.name.en.toLowerCase().includes(q) ||
      loc.division.bn.toLowerCase().includes(q) ||
      loc.division.en.toLowerCase().includes(q),
  );
}

export async function listHandoverPoints(
  locationId?: string,
): Promise<HandoverPoint[]> {
  await simulateLatency();
  const points = getStore().handoverPoints;
  if (!locationId) {
    return [...points];
  }
  return points.filter((hp) => hp.locationId === locationId);
}

// ——— Trips ———

export async function listTrips(
  filters: TripFilters = {},
): Promise<Paginated<TripWithDetails>> {
  await simulateLatency();
  const store = getStore();
  let items = store.trips.filter(
    (t) => t.status === "open" && t.remainingCapacityKg > 0,
  );

  if (filters.originId) {
    items = items.filter((t) => t.originId === filters.originId);
  }
  if (filters.destinationId) {
    items = items.filter((t) => t.destinationId === filters.destinationId);
  }
  if (filters.minCapacityKg != null) {
    items = items.filter((t) => t.remainingCapacityKg >= filters.minCapacityKg!);
  }
  if (filters.departureFrom) {
    items = items.filter((t) => t.departureAt >= filters.departureFrom!);
  }
  if (filters.departureTo) {
    items = items.filter((t) => t.departureAt <= filters.departureTo!);
  }
  if (filters.date) {
    items = items.filter((t) => t.departureAt.slice(0, 10) === filters.date);
  }
  if (filters.verifiedOnly) {
    items = items.filter((t) => {
      const traveler = store.users.find((u) => u.id === t.travelerId);
      return traveler?.isVerifiedTraveler;
    });
  }

  const sort = filters.sort ?? "departure_asc";
  items = [...items].sort((a, b) => {
    switch (sort) {
      case "departure_desc":
        return b.departureAt.localeCompare(a.departureAt);
      case "price_asc":
        return a.pricePerKgMinor - b.pricePerKgMinor;
      case "price_desc":
        return b.pricePerKgMinor - a.pricePerKgMinor;
      default:
        return a.departureAt.localeCompare(b.departureAt);
    }
  });

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const total = items.length;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize).map((t) => enrichTrip(t, store));

  return { items: pageItems, total, page, pageSize };
}

export async function getTrip(id: string): Promise<TripWithDetails> {
  await simulateLatency();
  const store = getStore();
  return enrichTrip(findTrip(store, id), store);
}

export async function createTrip(input: CreateTripInput): Promise<TripWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    findLocation(s, input.originId);
    findLocation(s, input.destinationId);
    for (const hpId of input.handoverPointIds) {
      if (!s.handoverPoints.some((hp) => hp.id === hpId)) {
        throwApiError("VALIDATION_ERROR", "Invalid handover point.", { hpId });
      }
    }
    const trip: Trip = {
      id: uid("trip"),
      travelerId: user.id,
      originId: input.originId,
      destinationId: input.destinationId,
      handoverPointIds: input.handoverPointIds,
      departureAt: input.departureAt,
      arrivalWindowStart: input.arrivalWindowStart,
      arrivalWindowEnd: input.arrivalWindowEnd,
      capacityKg: input.capacityKg,
      remainingCapacityKg: input.capacityKg,
      pricePerKgMinor: input.pricePerKgMinor,
      acceptedParcelTypes: input.acceptedParcelTypes,
      notes: input.notes,
      status: "open",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    s.trips.unshift(trip);
  });
  const created = store.trips[0]!;
  return enrichTrip(created, store);
}

export async function updateTrip(
  id: string,
  partial: Partial<Trip>,
): Promise<TripWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const trip = findTrip(s, id);
    if (trip.travelerId !== user.id) {
      throwApiError("FORBIDDEN", "You can only edit your own trips.");
    }
    Object.assign(trip, partial, { id: trip.id, updatedAt: nowIso() });
  });
  return enrichTrip(findTrip(store, id), store);
}

export async function listMyTrips(): Promise<TripWithDetails[]> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  return store.trips
    .filter((t) => t.travelerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((t) => enrichTrip(t, store));
}

export async function listTripRequests(tripId: string): Promise<ShipmentWithDetails[]> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  const trip = findTrip(store, tripId);
  if (trip.travelerId !== user.id) {
    throwApiError("FORBIDDEN", "Only the trip owner can view requests.");
  }
  return store.shipments
    .filter((s) => s.tripId === tripId && s.status === "requested")
    .map((s) => enrichShipment(s, store));
}

export async function acceptShipment(shipmentId: string): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const shipment = findShipment(s, shipmentId);
    if (!shipment.tripId) {
      throwApiError("VALIDATION_ERROR", "Shipment is not linked to a trip.");
    }
    const trip = findTrip(s, shipment.tripId);
    if (trip.travelerId !== user.id) {
      throwApiError("FORBIDDEN", "Only the traveler can accept this request.");
    }
    if (!canTransition(shipment.status, "accepted")) {
      throwApiError("INVALID_TRANSITION", "Cannot accept shipment in this state.");
    }
    decreaseTripCapacity(s, shipment);
    shipment.status = "accepted";
    shipment.updatedAt = nowIso();
    appendTimelineEvent(shipment, "accepted", user.id);
    addNotification(
      s,
      shipment.senderId,
      { bn: "অনুরোধ গৃহীত", en: "Request accepted" },
      {
        bn: `${shipment.trackingNumber} আপনার ট্রিপে যুক্ত হয়েছে।`,
        en: `${shipment.trackingNumber} was accepted on your trip.`,
      },
      `/shipments/${shipment.id}`,
    );
  });
  const shipment = findShipment(store, shipmentId);
  return enrichShipment(shipment, store);
}

export async function rejectShipment(shipmentId: string): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const shipment = findShipment(s, shipmentId);
    if (!shipment.tripId) {
      throwApiError("VALIDATION_ERROR", "Shipment is not linked to a trip.");
    }
    const trip = findTrip(s, shipment.tripId);
    if (trip.travelerId !== user.id) {
      throwApiError("FORBIDDEN", "Only the traveler can reject this request.");
    }
    if (!canTransition(shipment.status, "rejected")) {
      throwApiError("INVALID_TRANSITION", "Cannot reject shipment in this state.");
    }
    shipment.status = "rejected";
    shipment.paymentStatus = "refunded";
    shipment.updatedAt = nowIso();
    appendTimelineEvent(shipment, "rejected", user.id);
    addNotification(
      s,
      shipment.senderId,
      { bn: "অনুরোধ প্রত্যাখ্যাত", en: "Request rejected" },
      {
        bn: `ভ্রমণকারী ${shipment.trackingNumber} গ্রহণ করেননি।`,
        en: `The traveler declined ${shipment.trackingNumber}.`,
      },
      `/shipments/${shipment.id}`,
    );
  });
  return enrichShipment(findShipment(store, shipmentId), store);
}

// ——— Quotes / Shipments ———

export async function getQuote(input: QuoteInput): Promise<Quote> {
  await simulateLatency();
  return computeQuote(getStore(), input);
}

export async function createShipment(
  input: CreateShipmentInput,
): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    findLocation(s, input.originId);
    findLocation(s, input.destinationId);
    if (input.handoverPointId) {
      const hp = s.handoverPoints.find((h) => h.id === input.handoverPointId);
      if (!hp) {
        throwApiError("VALIDATION_ERROR", "Invalid handover point.");
      }
    }
    if (input.tripId) {
      findTrip(s, input.tripId);
    }
    if (!isValidBdPhone(input.receiverPhone)) {
      throwApiError("VALIDATION_ERROR", "Receiver phone is invalid.", {
        field: "receiverPhone",
      });
    }

    const quote = computeQuote(s, {
      originId: input.originId,
      destinationId: input.destinationId,
      weightKg: input.parcel.weightKg,
      size: input.parcel.size,
      declaredValueMinor: input.parcel.declaredValueMinor,
      tripId: input.tripId,
    });

    const asDraft = input.asDraft ?? false;
    const status: ShipmentStatus =
      !asDraft && input.tripId ? "requested" : "draft";

    const shipment: Shipment = {
      id: uid("ship"),
      trackingNumber: generateTrackingNumber(),
      senderId: user.id,
      receiverId: resolveReceiverId(s, input.receiverPhone),
      receiverName: input.receiverName,
      receiverPhone: normalizePhone(input.receiverPhone),
      tripId: input.tripId,
      originId: input.originId,
      destinationId: input.destinationId,
      handoverPointId: input.handoverPointId,
      parcel: input.parcel,
      status,
      paymentStatus: status === "draft" ? "unpaid" : "pending",
      quoteTotalMinor: quote.totalMinor,
      deliveryCode: undefined,
      timeline: [
        {
          id: uid("tl"),
          status,
          label: TIMELINE_LABELS[status],
          at: nowIso(),
          actorId: user.id,
        },
      ],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      isSenderReceiver: input.isSenderReceiver,
    };

    s.shipments.unshift(shipment);

    if (status === "requested" && input.tripId) {
      const trip = findTrip(s, input.tripId);
      addNotification(
        s,
        trip.travelerId,
        { bn: "নতুন বুকিং অনুরোধ", en: "New booking request" },
        {
          bn: `${shipment.trackingNumber} আপনার ট্রিপে যুক্ত হতে চায়।`,
          en: `${shipment.trackingNumber} requested a spot on your trip.`,
        },
        `/trips/${trip.id}`,
      );
    }
  });

  const created = store.shipments[0]!;
  return enrichShipment(created, store);
}

export async function updateShipment(
  id: string,
  partial: Partial<Shipment>,
): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const shipment = findShipment(s, id);
    if (shipment.senderId !== user.id) {
      throwApiError("FORBIDDEN", "Only the sender can update this shipment.");
    }
    const rest = { ...partial };
    delete rest.id;
    delete rest.timeline;
    Object.assign(shipment, rest, { id: shipment.id, updatedAt: nowIso() });
  });
  return enrichShipment(findShipment(store, id), store);
}

export async function listSending(filters?: {
  status?: ShipmentStatus;
  q?: string;
}): Promise<ShipmentWithDetails[]> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  let items = store.shipments.filter((s) => s.senderId === user.id);
  if (filters?.status) {
    items = items.filter((s) => s.status === filters.status);
  }
  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter(
      (s) =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.receiverName.toLowerCase().includes(q) ||
        s.parcel.description.toLowerCase().includes(q),
    );
  }
  return items
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((s) => enrichShipment(s, store));
}

export async function listReceiving(): Promise<ShipmentWithDetails[]> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  return store.shipments
    .filter(
      (s) =>
        s.receiverId === user.id ||
        s.receiverPhone === user.phone,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((s) => enrichShipment(s, store));
}

export async function listCarrying(): Promise<ShipmentWithDetails[]> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  const myTripIds = new Set(
    store.trips.filter((t) => t.travelerId === user.id).map((t) => t.id),
  );
  return store.shipments
    .filter(
      (s) =>
        s.tripId &&
        myTripIds.has(s.tripId) &&
        CARRYING_STATUSES.includes(s.status),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((s) => enrichShipment(s, store));
}

export async function getShipment(id: string): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = getStore();
  return enrichShipment(findShipment(store, id), store);
}

export async function transitionShipment(
  id: string,
  to: ShipmentStatus,
): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const shipment = findShipment(s, id);
    if (!canTransition(shipment.status, to)) {
      throwApiError("INVALID_TRANSITION", `Cannot move from ${shipment.status} to ${to}.`);
    }

    const trip = shipment.tripId ? findTrip(s, shipment.tripId) : undefined;
    const isTraveler = trip?.travelerId === user.id;
    const isSender = shipment.senderId === user.id;

    if (to === "cancelled" && !isSender && !isTraveler) {
      throwApiError("FORBIDDEN", "You cannot cancel this shipment.");
    }
    if (
      ["accepted", "confirmed", "picked_up", "in_transit", "ready_for_handover", "delivered", "delivery_failed", "returned", "rejected"].includes(
        to,
      ) &&
      !isTraveler &&
      to !== "cancelled"
    ) {
      if (!(to === "requested" && isSender)) {
        throwApiError("FORBIDDEN", "Only the traveler can update delivery progress.");
      }
    }
    if (to === "requested" && !isSender) {
      throwApiError("FORBIDDEN", "Only the sender can submit a draft.");
    }

    const prev = shipment.status;
    if (prev === "accepted" && to === "cancelled") {
      restoreTripCapacity(s, shipment);
    }

    shipment.status = to;
    shipment.updatedAt = nowIso();
    appendTimelineEvent(shipment, to, user.id);

    if (to === "confirmed" && !shipment.deliveryCode) {
      shipment.deliveryCode = generateDeliveryCode();
      shipment.paymentStatus = "paid";
    }

    const tracking = shipment.trackingNumber;
    const href = `/shipments/${shipment.id}`;

    if (to === "requested" && trip) {
      addNotification(
        s,
        trip.travelerId,
        { bn: "নতুন বুকিং অনুরোধ", en: "New booking request" },
        {
          bn: `${tracking} আপনার ট্রিপে জায়গা চেয়েছে।`,
          en: `${tracking} requested a spot on your trip.`,
        },
        `/trips/${trip.id}`,
      );
    } else if (to === "confirmed") {
      addNotification(
        s,
        shipment.senderId,
        { bn: "বুকিং নিশ্চিত", en: "Booking confirmed" },
        {
          bn: `${tracking} নিশ্চিত হয়েছে। ডেলিভারি কোড প্রস্তুত।`,
          en: `${tracking} is confirmed. Delivery code is ready.`,
        },
        href,
      );
    } else if (to === "picked_up") {
      addNotification(
        s,
        shipment.senderId,
        { bn: "পার্সেল সংগ্রহ", en: "Parcel picked up" },
        { bn: `${tracking} সংগ্রহ করা হয়েছে।`, en: `${tracking} was picked up.` },
        href,
      );
    } else if (to === "in_transit") {
      addNotification(
        s,
        shipment.senderId,
        { bn: "পথে", en: "In transit" },
        { bn: `${tracking} এখন পথে।`, en: `${tracking} is in transit.` },
        href,
      );
      if (shipment.receiverId) {
        addNotification(
          s,
          shipment.receiverId,
          { bn: "পথে", en: "In transit" },
          { bn: `${tracking} আপনার দিকে আসছে।`, en: `${tracking} is on the way to you.` },
          href,
        );
      }
    } else if (to === "ready_for_handover") {
      const receiverTarget =
        shipment.receiverId ??
        s.users.find((u) => u.phone === shipment.receiverPhone)?.id;
      if (receiverTarget) {
        addNotification(
          s,
          receiverTarget,
          { bn: "হস্তান্তর প্রস্তুত", en: "Ready for handover" },
          {
            bn: `${tracking} গ্রহণের জন্য প্রস্তুত।`,
            en: `${tracking} is ready for handover.`,
          },
          href,
        );
      }
    } else if (to === "delivered") {
      addNotification(
        s,
        shipment.senderId,
        { bn: "ডেলিভারি সম্পন্ন", en: "Delivered" },
        { bn: `${tracking} সফলভাবে বিতরণ হয়েছে।`, en: `${tracking} was delivered.` },
        href,
      );
    } else if (to === "cancelled") {
      addNotification(
        s,
        shipment.senderId,
        { bn: "বাতিল", en: "Cancelled" },
        { bn: `${tracking} বাতিল করা হয়েছে।`, en: `${tracking} was cancelled.` },
        href,
      );
    }
  });
  return enrichShipment(findShipment(store, id), store);
}

export async function confirmDelivery(
  id: string,
  code: string,
): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const shipment = findShipment(s, id);
    if (!shipment.deliveryCode) {
      throwApiError("VALIDATION_ERROR", "No delivery code on this shipment.");
    }
    if (code.trim() !== shipment.deliveryCode) {
      throwApiError("INVALID_CODE", "Delivery code does not match.");
    }
    if (
      shipment.status !== "ready_for_handover" &&
      shipment.status !== "in_transit"
    ) {
      throwApiError(
        "INVALID_TRANSITION",
        "Shipment must be ready for handover or in transit to confirm delivery.",
      );
    }
    if (!canTransition(shipment.status, "delivered")) {
      throwApiError("INVALID_TRANSITION", "Cannot mark this shipment as delivered.");
    }
    const isParty =
      shipment.senderId === user.id ||
      shipment.receiverId === user.id ||
      shipment.receiverPhone === user.phone ||
      (shipment.tripId &&
        findTrip(s, shipment.tripId).travelerId === user.id);
    if (!isParty) {
      throwApiError("FORBIDDEN", "You are not authorized to confirm this delivery.");
    }
    shipment.status = "delivered";
    shipment.updatedAt = nowIso();
    appendTimelineEvent(shipment, "delivered", user.id);
    addNotification(
      s,
      shipment.senderId,
      { bn: "ডেলিভারি সম্পন্ন", en: "Delivered" },
      {
        bn: `${shipment.trackingNumber} সফলভাবে বিতরণ হয়েছে।`,
        en: `${shipment.trackingNumber} was delivered.`,
      },
      `/shipments/${shipment.id}`,
    );
  });
  return enrichShipment(findShipment(store, id), store);
}

export async function cancelShipment(id: string): Promise<ShipmentWithDetails> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  const shipment = findShipment(store, id);
  if (shipment.senderId !== user.id) {
    const trip = shipment.tripId ? findTrip(store, shipment.tripId) : undefined;
    if (trip?.travelerId !== user.id) {
      throwApiError("FORBIDDEN", "You cannot cancel this shipment.");
    }
  }
  if (!canTransition(shipment.status, "cancelled")) {
    throwApiError("INVALID_TRANSITION", "This shipment cannot be cancelled.");
  }
  return transitionShipment(id, "cancelled");
}

// ——— Messaging / Notifications ———

export async function listMessages(shipmentId: string): Promise<Message[]> {
  await simulateLatency();
  const store = getStore();
  requireUser(store);
  findShipment(store, shipmentId);
  return store.messages
    .filter((m) => m.shipmentId === shipmentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function sendMessage(
  shipmentId: string,
  body: string,
): Promise<Message> {
  await simulateLatency();
  const trimmed = body.trim();
  if (!trimmed) {
    throwApiError("VALIDATION_ERROR", "Message cannot be empty.");
  }
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const shipment = findShipment(s, shipmentId);
    const isParty =
      shipment.senderId === user.id ||
      shipment.receiverId === user.id ||
      shipment.receiverPhone === user.phone ||
      (shipment.tripId &&
        findTrip(s, shipment.tripId).travelerId === user.id);
    if (!isParty) {
      throwApiError("FORBIDDEN", "You are not part of this shipment conversation.");
    }
    const message: Message = {
      id: uid("msg"),
      shipmentId,
      senderId: user.id,
      body: trimmed,
      createdAt: nowIso(),
    };
    s.messages.push(message);

    const notifyIds = new Set<string>();
    if (shipment.senderId !== user.id) {
      notifyIds.add(shipment.senderId);
    }
    if (shipment.receiverId && shipment.receiverId !== user.id) {
      notifyIds.add(shipment.receiverId);
    }
    if (shipment.tripId) {
      const travelerId = findTrip(s, shipment.tripId).travelerId;
      if (travelerId !== user.id) {
        notifyIds.add(travelerId);
      }
    }
    for (const uidTarget of notifyIds) {
      addNotification(
        s,
        uidTarget,
        { bn: "নতুন বার্তা", en: "New message" },
        {
          bn: `${user.displayName} ${shipment.trackingNumber} সম্পর্কে বার্তা পাঠিয়েছেন।`,
          en: `${user.displayName} sent a message about ${shipment.trackingNumber}.`,
        },
        `/shipments/${shipmentId}`,
      );
    }
  });
  const messages = store.messages.filter((m) => m.shipmentId === shipmentId);
  return messages[messages.length - 1]!;
}

export async function listNotifications(): Promise<NotificationItem[]> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  return store.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(id: string): Promise<void> {
  await simulateLatency();
  mutateStore((s) => {
    const user = requireUser(s);
    const notif = s.notifications.find((n) => n.id === id);
    if (!notif) {
      throwApiError("NOT_FOUND", "Notification not found.");
    }
    if (notif.userId !== user.id) {
      throwApiError("FORBIDDEN", "Not your notification.");
    }
    notif.read = true;
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await simulateLatency();
  mutateStore((s) => {
    const user = requireUser(s);
    for (const n of s.notifications) {
      if (n.userId === user.id) {
        n.read = true;
      }
    }
  });
}

// ——— Other ———

export async function listEarnings(): Promise<Earning[]> {
  await simulateLatency();
  const store = getStore();
  const user = requireUser(store);
  return store.earnings
    .filter((e) => e.travelerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReviews(userId?: string): Promise<Review[]> {
  await simulateLatency();
  const store = getStore();
  let items = store.reviews;
  if (userId) {
    items = items.filter((r) => r.toUserId === userId);
  }
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReview(input: {
  shipmentId: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  await simulateLatency();
  if (input.rating < 1 || input.rating > 5) {
    throwApiError("VALIDATION_ERROR", "Rating must be between 1 and 5.");
  }
  const store = mutateStore((s) => {
    const user = requireUser(s);
    const shipment = findShipment(s, input.shipmentId);
    if (shipment.status !== "delivered") {
      throwApiError("VALIDATION_ERROR", "Reviews are only allowed after delivery.");
    }
    const isSender = shipment.senderId === user.id;
    const isReceiver =
      shipment.receiverId === user.id || shipment.receiverPhone === user.phone;
    if (!isSender && !isReceiver) {
      throwApiError("FORBIDDEN", "Only shipment parties can leave a review.");
    }
    if (s.reviews.some((r) => r.shipmentId === input.shipmentId && r.fromUserId === user.id)) {
      throwApiError("VALIDATION_ERROR", "You already reviewed this shipment.");
    }

    let toUserId: string | undefined;
    if (isSender && shipment.tripId) {
      toUserId = findTrip(s, shipment.tripId).travelerId;
    } else if (isReceiver) {
      toUserId = shipment.senderId;
    } else if (isSender && shipment.receiverId) {
      toUserId = shipment.receiverId;
    }
    if (!toUserId || toUserId === user.id) {
      throwApiError("VALIDATION_ERROR", "Cannot determine review recipient.");
    }

    const review: Review = {
      id: uid("rev"),
      shipmentId: input.shipmentId,
      fromUserId: user.id,
      toUserId,
      rating: input.rating,
      comment: input.comment.trim(),
      createdAt: nowIso(),
    };
    s.reviews.unshift(review);

    const target = s.users.find((u) => u.id === toUserId);
    if (target) {
      const count = target.ratingCount + 1;
      target.ratingAvg =
        (target.ratingAvg * target.ratingCount + input.rating) / count;
      target.ratingCount = count;
    }
  });
  return store.reviews[0]!;
}

export async function resetDemoData(): Promise<void> {
  await simulateLatency();
  resetStore();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(PENDING_PHONE_KEY);
  }
}
