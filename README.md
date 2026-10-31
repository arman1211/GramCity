# GramCity Express / গ্রামসিটি এক্সপ্রেস

Bangladesh-focused **community parcel delivery** demo: senders book space on travelers’ existing routes. One account can send, receive, and carry parcels.

**Important:** Payments, OTP, identity verification, and delivery progress are **simulations**. There is **no real SMS**, payment gateway, or courier integration. Data lives in the browser (local mock store).

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** + shadcn-style UI components
- **next-intl** — Bangla (`bn`) and English (`en`)
- **React Hook Form** + **Zod** for forms
- Typed API layer: `src/lib/api` (mock implementation today)

## Setup

```bash
npm install
npm run dev      # http://localhost:3000 → redirects to /bn
npm run build
npm run lint
```

Open [http://localhost:3000](http://localhost:3000). The root URL redirects to **`/bn`** (default locale). English routes use **`/en`**.

## Demo sign-in

1. Enter a Bangladesh mobile number from the personas table below (or use quick persona pick on the sign-in screen).
2. OTP step: enter **`123456`** (fixed demo code; no SMS is sent).

## Demo personas

| Display name | Phone | Role (demo label) |
|--------------|-------|-------------------|
| মোহাম্মদ রফিক | +8801712345001 | Verified traveler · frequent Dhaka–Pabna route |
| ফাতেমা বেগম | +8801812345002 | Sender & receiver · Gazipur |
| আরিফ হোসেন | +8801912345003 | Traveler · Chattogram corridor |
| নুসরাত জাহান | +8801612345004 | Receiver · Cumilla |
| কামাল উদ্দিন | +8801512345005 | Verified traveler · Bogura–Dhaka |
| সাবরিনা আক্তার | +8801312345006 | Sender · Mymensingh |
| তানভীর আহমেদ | +8801412345007 | Traveler & sender · Dhaka hub |

You can also **switch persona** from Profile without re-entering OTP (demo shortcut).

## Language

- Default locale: **`bn`** (`/bn/...`)
- English: **`/en/...`**
- Language switcher preserves the current path where possible.

## Architecture (folders)

| Path | Purpose |
|------|---------|
| `src/app/[locale]/` | Localized routes (public marketing, auth, authenticated app) |
| `src/components/` | UI primitives, layout, shared feature components |
| `src/lib/api/` | API client (`client.ts`) and exports (`index.ts`) |
| `src/lib/types/` | Shared TypeScript domain types |
| `src/lib/mock/` | Seed data, localStorage store, shipment transition rules |
| `src/i18n/` | next-intl routing and request config |
| `src/hooks/` | Auth and other client hooks |
| `docs/api-contract.md` | REST contract for a future FastAPI backend |

UI pages import **`@/lib/api`**, not the mock store directly.

## Replace mock with FastAPI

The frontend is built against function signatures in `src/lib/api/index.ts`. Today `client.ts` reads/writes `src/lib/mock/store.ts`.

To go live:

1. Implement REST endpoints described in **[docs/api-contract.md](docs/api-contract.md)** (`/api/v1`, same JSON shapes as `src/lib/types/index.ts`).
2. Swap the implementation inside **`src/lib/api/client.ts`** to HTTP `fetch` while keeping exports stable.
3. Handle auth (session cookie or bearer token) and map API errors to `ApiClientError`.

No page-level changes should be required if responses match the contract.

## Reset demo data

From **Profile**, use **Reset demo data** to restore the seeded scenarios and clear the current session state (same as `resetDemoData()` in the API client).
