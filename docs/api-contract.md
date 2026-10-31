# GramCity Express — REST API contract (v1)

This document describes the HTTP API a future **FastAPI** backend should implement so the Next.js UI can replace the in-browser mock in `src/lib/api/client.ts`. Every endpoint below maps to an exported function in that file (re-exported from `src/lib/api/index.ts`).

**Base path:** `/api/v1`

**Content type:** `application/json` unless noted.

**Authentication:** Session cookie or `Authorization: Bearer <token>` (implementation choice). Endpoints marked **auth** require a signed-in user. The mock uses `DemoStore.currentUserId`; the backend should bind the session to a `User` record.

**Demo-only behavior:** OTP is fixed (`123456`), personas can sign in by `userId`, and demo data can be reset. Production backends may drop or gate these routes.

---

## Conventions

### Money

All monetary fields are **integer minor units (poisha)** for BDT: **100 poisha = 1 BDT**. Examples: `8000` = ৳80.00, `quoteTotalMinor`, `pricePerKgMinor`, `amountMinor`, `declaredValueMinor`.

`Quote.currency` is always `"BDT"`. `Quote.isDemoEstimate` is always `true` in the current product (UI treats quotes as estimates).

### Timestamps

All `*At` fields are **ISO 8601** strings in **UTC** (e.g. `2026-10-26T04:00:00.000Z`). The demo seed anchors “now” to **26 Oct 2026, 10:00 Asia/Dhaka** (`2026-10-26T04:00:00.000Z`). Display formatting and date filters in the UI should use **Asia/Dhaka** where users expect local calendar days (e.g. trip `date` filter compares `departureAt.slice(0, 10)`).

### Localization

`LocalizedString` is `{ "bn": string, "en": string }`. API responses return both locales; the UI picks by route (`/bn`, `/en`).

### Pagination

Used by trip search only (matches `Paginated<T>`):

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 10
}
```

Query params: `page` (default 1), `pageSize` (default 10).

### Errors

Failed requests return a JSON body matching `ApiError`:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Human-readable message",
  "details": { "field": "phone" }
}
```

HTTP status mapping is backend-defined; suggested mapping: `401` → `UNAUTHORIZED`, `403` → `FORBIDDEN`, `404` → `NOT_FOUND`, `409` → `CONFLICT` or `INVALID_TRANSITION`, `422` → `VALIDATION_ERROR`.

| Code | When |
|------|------|
| `UNAUTHORIZED` | Missing or invalid session |
| `FORBIDDEN` | Authenticated but not allowed (wrong role/party) |
| `NOT_FOUND` | Entity id not found |
| `VALIDATION_ERROR` | Invalid input, business rule on fields |
| `CONFLICT` | Duplicate or incompatible state (reserve for production; mock rarely uses) |
| `INVALID_TRANSITION` | Illegal shipment status change |

The mock also uses **`INVALID_OTP`**, **`INVALID_CODE`**, and **`CAPACITY_EXCEEDED`**; a production API may fold these into `VALIDATION_ERROR` or keep them explicit.

---

## Status enums (keep separate)

**ShipmentStatus** (`Shipment.status`, timeline events):  
`draft` | `requested` | `accepted` | `confirmed` | `picked_up` | `in_transit` | `ready_for_handover` | `delivered` | `rejected` | `cancelled` | `delivery_failed` | `returned`

**PaymentStatus** (`Shipment.paymentStatus`):  
`unpaid` | `pending` | `paid` | `refunded` | `failed`

**PayoutStatus** (`Earning.payoutStatus`):  
`pending` | `processing` | `completed` | `failed`

**TripStatus** (`Trip.status`):  
`draft` | `open` | `full` | `in_progress` | `completed` | `cancelled`

**ParcelSize:** `small` | `medium` | `large`  
**ParcelCategory:** `documents` | `clothes` | `electronics` | `food_dry` | `gifts` | `other`

---

## Shared types (response shapes)

Summaries align with `src/lib/types/index.ts`.

| Type | Fields |
|------|--------|
| **Location** | `id`, `name`, `division` (LocalizedString), `lat`, `lng` |
| **HandoverPoint** | `id`, `locationId`, `name`, `address` (LocalizedString) |
| **UserPublic** | `id`, `displayName`, `phoneMasked`, `avatarInitials`, `isVerifiedTraveler`, `ratingAvg`, `ratingCount`, `tripsCompleted`, `memberSince` |
| **User** | UserPublic + `phone`, `preferredLocale` (`bn`\|`en`), optional `email`, `bio` |
| **Trip** | `id`, `travelerId`, `originId`, `destinationId`, `handoverPointIds[]`, `departureAt`, `arrivalWindowStart`, `arrivalWindowEnd`, `capacityKg`, `remainingCapacityKg`, `pricePerKgMinor`, `acceptedParcelTypes[]`, optional `notes`, `status`, `createdAt`, `updatedAt` |
| **TripWithDetails** | Trip + `traveler` (UserPublic), `origin`, `destination`, `handoverPoints[]` |
| **ParcelDetails** | `category`, `description`, `weightKg`, `size`, optional `dimensionsCm` `{ l, w, h }`, `declaredValueMinor`, optional `imageDataUrl` |
| **Quote** | `routeLabel`, `weightKg`, `size`, `lines[]` (QuoteLine), `totalMinor`, `currency`: `"BDT"`, `isDemoEstimate`: `true` |
| **QuoteLine** | `code`, `label`, `amountMinor` |
| **Shipment** | `id`, `trackingNumber`, `senderId`, optional `receiverId`, `receiverName`, `receiverPhone`, optional `tripId`, `originId`, `destinationId`, optional `handoverPointId`, `parcel`, `status`, `paymentStatus`, `quoteTotalMinor`, optional `deliveryCode`, `timeline[]`, `createdAt`, `updatedAt`, `isSenderReceiver` |
| **ShipmentWithDetails** | Shipment + `sender`, optional `receiver`, optional `trip` (TripWithDetails), `origin`, `destination`, optional `handoverPoint` |
| **TimelineEvent** | `id`, `status` (ShipmentStatus or `"note"`), `label`, `at`, optional `actorId` |
| **Message** | `id`, `shipmentId`, `senderId`, `body`, `createdAt` |
| **NotificationItem** | `id`, `userId`, `title`, `body`, optional `href`, `read`, `createdAt` |
| **Review** | `id`, `shipmentId`, `fromUserId`, `toUserId`, `rating` (1–5), `comment`, `createdAt` |
| **Earning** | `id`, `travelerId`, `shipmentId`, `amountMinor`, `payoutStatus`, `description`, `createdAt`, optional `paidAt` |

---

## Auth

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `getCurrentUser()` | `GET /auth/me` | optional | — | `User` or `null` / `204` |
| `listDemoPersonas()` | `GET /auth/demo-personas` | no | — | `{ userId, displayName, phone, role }[]` |
| `signInWithPhone(phone)` | `POST /auth/phone` | no | `{ "phone": string }` (BD mobile) | `{ "ok": true }` — starts OTP flow (demo: no SMS) |
| `verifyOtp(code)` | `POST /auth/verify-otp` | no | `{ "code": string }` | `User` — demo accepts only `123456`; phone from prior step |
| `signInDemoAccount(userId)` | `POST /auth/demo-sign-in` | no | `{ "userId": string }` | `User` |
| `switchPersona(userId)` | `POST /auth/switch-persona` | yes | `{ "userId": string }` | `User` |
| `signOut()` | `POST /auth/sign-out` | yes | — | empty / `{ "ok": true }` |

**Demo OTP:** Any Bangladesh-valid phone that exists in seed data + code **`123456`**. Invalid code → `INVALID_OTP`. Unknown phone → `NOT_FOUND`.

---

## Locations & handover points

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `listLocations()` | `GET /locations` | no | — | `Location[]` |
| `searchLocations(query)` | `GET /locations` | no | Query `q` (optional; empty = all) | `Location[]` — match `name` / `division` bn or en |
| `listHandoverPoints(locationId?)` | `GET /handover-points` | no | Query `locationId` (optional) | `HandoverPoint[]` |

---

## Trips

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `listTrips(filters)` | `GET /trips` | no | Query: `originId`, `destinationId`, `date` (YYYY-MM-DD on `departureAt`), `minCapacityKg`, `departureFrom`, `departureTo`, `verifiedOnly`, `sort` (`departure_asc`\|`departure_desc`\|`price_asc`\|`price_desc`), `page`, `pageSize` | `Paginated<TripWithDetails>` — only `open` trips with `remainingCapacityKg > 0` |
| `getTrip(id)` | `GET /trips/{id}` | no | — | `TripWithDetails` |
| `createTrip(input)` | `POST /trips` | yes | **CreateTripInput** | `TripWithDetails` — new trip `status`: `open` |
| `updateTrip(id, partial)` | `PATCH /trips/{id}` | yes | Partial **Trip** (owner only) | `TripWithDetails` |
| `listMyTrips()` | `GET /me/trips` | yes | — | `TripWithDetails[]` |
| `listTripRequests(tripId)` | `GET /trips/{tripId}/requests` | yes | — | `ShipmentWithDetails[]` — `status` = `requested`, trip owner only |
| `acceptShipment(shipmentId)` | `POST /shipments/{shipmentId}/accept` | yes | — | `ShipmentWithDetails` — traveler; may `CAPACITY_EXCEEDED` |
| `rejectShipment(shipmentId)` | `POST /shipments/{shipmentId}/reject` | yes | — | `ShipmentWithDetails` — sets `paymentStatus` `refunded` |

**CreateTripInput:** `originId`, `destinationId`, `handoverPointIds[]`, `departureAt`, `arrivalWindowStart`, `arrivalWindowEnd`, `capacityKg`, `pricePerKgMinor`, `acceptedParcelTypes[]`, optional `notes`.

---

## Quotes

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `getQuote(input)` | `POST /quotes` | no* | **QuoteInput** | **Quote** |

\*Mock does not require auth; backend may allow anonymous estimates.

**QuoteInput:** `originId`, `destinationId`, `weightKg`, `size`, optional `declaredValueMinor`, optional `tripId` (uses trip’s `pricePerKgMinor` when set).

---

## Shipments

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `createShipment(input)` | `POST /shipments` | yes | **CreateShipmentInput** | `ShipmentWithDetails` |
| `updateShipment(id, partial)` | `PATCH /shipments/{id}` | yes | Partial **Shipment** (sender; no `id`/`timeline` overwrite) | `ShipmentWithDetails` |
| `listSending(filters?)` | `GET /me/shipments/sending` | yes | Query optional `status`, `q` (tracking, receiver name, description) | `ShipmentWithDetails[]` |
| `listReceiving()` | `GET /me/shipments/receiving` | yes | — | `ShipmentWithDetails[]` — match `receiverId` or `receiverPhone` |
| `listCarrying()` | `GET /me/shipments/carrying` | yes | — | `ShipmentWithDetails[]` — traveler’s trips, statuses in carrying set |
| `getShipment(id)` | `GET /shipments/{id}` | yes** | — | `ShipmentWithDetails` |
| `transitionShipment(id, to)` | `POST /shipments/{id}/transition` | yes | `{ "to": ShipmentStatus }` | `ShipmentWithDetails` — role rules + `canTransition` |
| `confirmDelivery(id, code)` | `POST /shipments/{id}/confirm-delivery` | yes | `{ "code": string }` | `ShipmentWithDetails` |
| `cancelShipment(id)` | `POST /shipments/{id}/cancel` | yes | — | `ShipmentWithDetails` — delegates to transition `cancelled` |

**CreateShipmentInput:** `originId`, `destinationId`, optional `handoverPointId`, optional `tripId`, `parcel`, `receiverName`, `receiverPhone`, `isSenderReceiver`, optional `asDraft`.  
If not draft and `tripId` set → `status` `requested`, `paymentStatus` `pending`; else `draft` / `unpaid`.

**Transition notes (mock):** `confirmed` generates `deliveryCode` and sets `paymentStatus` `paid`. Sender may submit draft → `requested`. Traveler drives most forward states.

**Carrying statuses:** `accepted`, `confirmed`, `picked_up`, `in_transit`, `ready_for_handover`.

---

## Messages

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `listMessages(shipmentId)` | `GET /shipments/{shipmentId}/messages` | yes | — | `Message[]` ascending by `createdAt` |
| `sendMessage(shipmentId, body)` | `POST /shipments/{shipmentId}/messages` | yes | `{ "body": string }` | `Message` — parties only; notifies others |

---

## Notifications

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `listNotifications()` | `GET /me/notifications` | yes | — | `NotificationItem[]` newest first |
| `markNotificationRead(id)` | `POST /me/notifications/{id}/read` | yes | — | empty |
| `markAllNotificationsRead()` | `POST /me/notifications/read-all` | yes | — | empty |

---

## Earnings

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `listEarnings()` | `GET /me/earnings` | yes | — | `Earning[]` for current user as traveler |

---

## Reviews

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `listReviews(userId?)` | `GET /reviews` | no | Query optional `userId` (reviews **to** that user) | `Review[]` |
| `createReview(input)` | `POST /reviews` | yes | `{ shipmentId, rating, comment }` | `Review` — after `delivered`, one review per user per shipment; updates recipient `ratingAvg` / `ratingCount` |

---

## Demo maintenance

| Client function | Method & path | Auth | Request | Response |
|-----------------|---------------|------|---------|----------|
| `resetDemoData()` | `POST /demo/reset` | yes / demo env | — | empty — restores seed store |

---

## Wiring the UI to FastAPI

1. Implement the routes above on FastAPI under `/api/v1`, returning the same JSON shapes as `src/lib/types/index.ts`.
2. Replace the **body** of `src/lib/api/client.ts` with `fetch` calls (or split into `client.http.ts` and re-export from `client.ts`). Keep **every exported function name and signature** unchanged.
3. Leave `src/lib/api/index.ts` as the public import surface (`@/lib/api`).
4. Map `ApiClientError` from non-2xx responses using the `code`, `message`, and `details` fields.
5. Send credentials (`credentials: 'include'`) if using cookies; or attach bearer tokens in one shared helper.
6. Remove or no-op `src/lib/mock/*` usage from the client only; pages and hooks should stay untouched.

Example import path (unchanged in UI):

```ts
import { listTrips, verifyOtp } from "@/lib/api";
```
