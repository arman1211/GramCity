/** Shared domain types for GramCity Express. Money uses integer minor units (poisha). */

export type Locale = "bn" | "en";

export type ShipmentStatus =
  | "draft"
  | "requested"
  | "accepted"
  | "confirmed"
  | "picked_up"
  | "in_transit"
  | "ready_for_handover"
  | "delivered"
  | "rejected"
  | "cancelled"
  | "delivery_failed"
  | "returned";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";

export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export type TripStatus = "draft" | "open" | "full" | "in_progress" | "completed" | "cancelled";

export type ParcelSize = "small" | "medium" | "large";

export type ParcelCategory =
  | "documents"
  | "clothes"
  | "electronics"
  | "food_dry"
  | "gifts"
  | "other";

export interface LocalizedString {
  bn: string;
  en: string;
}

export interface Location {
  id: string;
  name: LocalizedString;
  division: LocalizedString;
  lat: number;
  lng: number;
}

export interface HandoverPoint {
  id: string;
  locationId: string;
  name: LocalizedString;
  address: LocalizedString;
}

export interface UserPublic {
  id: string;
  displayName: string;
  phoneMasked: string;
  avatarInitials: string;
  isVerifiedTraveler: boolean;
  ratingAvg: number;
  ratingCount: number;
  tripsCompleted: number;
  memberSince: string;
}

export interface User extends UserPublic {
  phone: string;
  email?: string;
  preferredLocale: Locale;
  bio?: string;
}

export interface Trip {
  id: string;
  travelerId: string;
  originId: string;
  destinationId: string;
  handoverPointIds: string[];
  departureAt: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  capacityKg: number;
  remainingCapacityKg: number;
  pricePerKgMinor: number;
  acceptedParcelTypes: ParcelCategory[];
  notes?: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TripWithDetails extends Trip {
  traveler: UserPublic;
  origin: Location;
  destination: Location;
  handoverPoints: HandoverPoint[];
}

export interface ParcelDetails {
  category: ParcelCategory;
  description: string;
  weightKg: number;
  size: ParcelSize;
  dimensionsCm?: { l: number; w: number; h: number };
  declaredValueMinor: number;
  imageDataUrl?: string;
}

export interface QuoteLine {
  code: string;
  label: LocalizedString;
  amountMinor: number;
}

export interface Quote {
  routeLabel: LocalizedString;
  weightKg: number;
  size: ParcelSize;
  lines: QuoteLine[];
  totalMinor: number;
  currency: "BDT";
  isDemoEstimate: true;
}

export interface TimelineEvent {
  id: string;
  status: ShipmentStatus | "note";
  label: LocalizedString;
  at: string;
  actorId?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  senderId: string;
  receiverId?: string;
  receiverName: string;
  receiverPhone: string;
  tripId?: string;
  originId: string;
  destinationId: string;
  handoverPointId?: string;
  parcel: ParcelDetails;
  status: ShipmentStatus;
  paymentStatus: PaymentStatus;
  quoteTotalMinor: number;
  deliveryCode?: string;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  isSenderReceiver: boolean;
}

export interface ShipmentWithDetails extends Shipment {
  sender: UserPublic;
  receiver?: UserPublic;
  trip?: TripWithDetails;
  origin: Location;
  destination: Location;
  handoverPoint?: HandoverPoint;
}

export interface Message {
  id: string;
  shipmentId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: LocalizedString;
  body: LocalizedString;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  shipmentId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Earning {
  id: string;
  travelerId: string;
  shipmentId: string;
  amountMinor: number;
  payoutStatus: PayoutStatus;
  description: LocalizedString;
  createdAt: string;
  paidAt?: string;
}

export interface BookingRequest {
  shipmentId: string;
  tripId: string;
  status: "pending" | "accepted" | "rejected";
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface TripFilters {
  originId?: string;
  destinationId?: string;
  date?: string;
  minCapacityKg?: number;
  departureFrom?: string;
  departureTo?: string;
  verifiedOnly?: boolean;
  sort?: "departure_asc" | "departure_desc" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export interface CreateTripInput {
  originId: string;
  destinationId: string;
  handoverPointIds: string[];
  departureAt: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  capacityKg: number;
  pricePerKgMinor: number;
  acceptedParcelTypes: ParcelCategory[];
  notes?: string;
}

export interface CreateShipmentInput {
  originId: string;
  destinationId: string;
  handoverPointId?: string;
  tripId?: string;
  parcel: ParcelDetails;
  receiverName: string;
  receiverPhone: string;
  isSenderReceiver: boolean;
  asDraft?: boolean;
}

export interface QuoteInput {
  originId: string;
  destinationId: string;
  weightKg: number;
  size: ParcelSize;
  declaredValueMinor?: number;
  tripId?: string;
}

export interface DemoStore {
  version: number;
  currentUserId: string | null;
  users: User[];
  locations: Location[];
  handoverPoints: HandoverPoint[];
  trips: Trip[];
  shipments: Shipment[];
  messages: Message[];
  notifications: NotificationItem[];
  reviews: Review[];
  earnings: Earning[];
}
