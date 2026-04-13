# 🚗 Vehicle Passport / Prometna Putovnica

> Your digital vehicle companion — garage, maintenance history, reminders, documents, and secure ownership transfer.
>
> Vaš digitalni suputnik vozila — garaža, povijest servisa, podsjetnici, dokumenti i sigurni prijenos vlasništva.

---

## Overview / Pregled

**Vehicle Passport** is a production-ready progressive web app (PWA) for private vehicle owners who want one organized, private, and shareable place for everything about their cars.

Key differentiators:
- **Official maintenance plans** — intervals sourced from verified manufacturer documentation, never invented
- **Secure share links** — read-only, tokenized, optional PIN, configurable visibility
- **Ownership transfer** — full audit-trail transfer flow with recipient acceptance
- **Mobile-first PWA** — installable, works offline, fast

---

## Features

### For Vehicle Owners
- 🏠 **Multi-vehicle garage** — add unlimited vehicles with full spec sheet
- 🔧 **Maintenance timeline** — chronological service history with costs, workshop, parts
- 🔔 **Smart reminders** — date-based, mileage-based, or whichever-comes-first
- 📄 **Document storage** — registration, insurance, invoices, photos (20MB each)
- 🔗 **Share links** — generate read-only links for mechanics or buyers
- 🔄 **Ownership transfer** — structured, audit-logged transfer with recipient consent
- 📊 **Official plans** — curated manufacturer service intervals with source traceability

### For Mechanics / Buyers
- 📖 Clean read-only vehicle profile via share link
- ✅ Trust-building layout showing verified maintenance history

### For Admins
- 🛠️ Maintenance plan management with verification workflow
- 📋 User and vehicle monitoring
- 🔍 Transfer and share link audit trail

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives + shadcn patterns |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Auth | NextAuth v5 (credentials + OAuth-ready) |
| File Storage | AWS S3-compatible (MinIO for local dev) |
| Email | Nodemailer (SMTP) |
| Validation | Zod v4 |
| Forms | React Hook Form |
| Testing | Jest + ts-jest |

---

## Prerequisites

- **Node.js** 20.9+
- **PostgreSQL** 14+ (or Docker)
- **S3-compatible storage** — MinIO for local dev, AWS S3 / Cloudflare R2 for production

---

## Local Development Setup

### 1. Clone and install dependencies

```bash
cd vehicle-passport
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, SMTP credentials, storage keys
```

Minimum required for local dev:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vehicle_passport"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

### 3. Start PostgreSQL + MinIO with Docker

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port `5432`
- MinIO (S3-compatible storage) on port `9000` (API) and `9001` (Console)
- Automatic bucket creation (`vehicle-passport`)

MinIO console: http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`)

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Seed demo data

```bash
npm run seed
```

This creates:
- Demo user: `demo@vehiclepassport.app` / `demo1234`
- Admin user: `admin@vehiclepassport.app` / `admin1234`
- 3 vehicles with complete service history, reminders, share links
- Verified maintenance plans for VW Golf Mk7, Toyota Yaris, Skoda Octavia Mk3

### 6. (Optional) Add more maintenance plans

```bash
npx tsx prisma/seed-maintenance-plans.ts
```

### 7. Start the development server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| User | `demo@vehiclepassport.app` | `demo1234` |
| Admin | `admin@vehiclepassport.app` | `admin1234` |

---

## Project Structure

```
vehicle-passport/
├── app/
│   ├── (app)/              # Authenticated user routes
│   │   ├── garage/         # Garage + vehicle pages
│   │   ├── reminders/      # Global reminders page
│   │   ├── documents/      # Global documents page
│   │   └── settings/       # User settings
│   ├── (admin)/            # Admin panel (requireAdmin)
│   │   └── admin/          # Plans, users, transfers, sources
│   ├── api/                # Route handlers
│   │   ├── auth/           # Register, forgot/reset password
│   │   ├── vehicles/       # Vehicle + sub-resource APIs
│   │   ├── share/          # Public share link APIs
│   │   ├── transfers/      # Transfer acceptance API
│   │   ├── user/           # Profile, settings, export
│   │   ├── admin/          # Admin stats
│   │   └── cron/           # Cron job handlers
│   ├── auth/               # Auth pages (login, register, reset)
│   ├── share/[token]/      # Public shared vehicle page
│   ├── transfer/accept/    # Transfer acceptance page
│   └── actions/            # Server actions
├── components/
│   ├── ui/                 # Base UI components (shadcn patterns)
│   ├── layout/             # Navbar, sidebar
│   ├── vehicles/           # Vehicle cards, forms, tabs
│   ├── maintenance/        # Service history, plan display
│   ├── reminders/          # Reminder list, add dialog
│   ├── documents/          # Document list, upload
│   ├── share/              # Share link manager
│   ├── transfers/          # Transfer dialog, ownership tab
│   └── settings/           # Settings forms
├── lib/
│   ├── auth/               # NextAuth config, password utils, session
│   ├── db/                 # Prisma singleton
│   ├── email/              # Nodemailer + email templates
│   ├── maintenance/        # Plan matching engine
│   ├── notifications/      # Reminder notification processor
│   ├── reminders/          # Status computation engine
│   └── storage/            # S3 upload/download utilities
├── types/                  # TypeScript types + bilingual label maps
├── prisma/
│   ├── schema.prisma       # Full database schema
│   ├── seed.ts             # Demo data seed
│   └── seed-maintenance-plans.ts  # Additional verified plans
├── __tests__/              # Unit + integration tests
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
└── docker-compose.yml      # Local dev: PostgreSQL + MinIO
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App base URL (full URL including protocol) |
| `NEXTAUTH_SECRET` | JWT secret (min 32 chars) |
| `SMTP_HOST` / `SMTP_PORT` | Email server for notifications |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials |
| `EMAIL_FROM` | From address for emails |
| `STORAGE_ENDPOINT` | S3 endpoint URL |
| `STORAGE_BUCKET` | S3 bucket name |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | S3 credentials |
| `STORAGE_PUBLIC_URL` | Public base URL for serving files |
| `NEXT_PUBLIC_APP_URL` | App public URL (used in emails + share links) |
| `CRON_SECRET` | Bearer token for cron job endpoints |

---

## Cron Jobs

Set up daily cron jobs:

### Process reminders
```
GET /api/cron/process-reminders
Authorization: Bearer <CRON_SECRET>
```

### Expire pending transfers
```
GET /api/cron/expire-transfers
Authorization: Bearer <CRON_SECRET>
```

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    { "path": "/api/cron/process-reminders", "schedule": "0 8 * * *" },
    { "path": "/api/cron/expire-transfers",  "schedule": "0 8 * * *" }
  ]
}
```

---

## Running Tests

```bash
npm test
```

Tests cover:
- Reminder status computation (date + mileage logic)
- Maintenance plan matching engine (confidence scoring)
- Ownership transfer flow (initiate, cancel, accept)

---

## Deployment

### Vercel (recommended)

1. Connect GitHub repo to Vercel
2. Add all environment variables in Vercel project settings
3. Use **Vercel Postgres** or external PostgreSQL (Supabase, Neon, Railway)
4. Use **Vercel Blob** or AWS S3 / Cloudflare R2 for file storage
5. Configure Vercel Cron for reminder processing

```bash
npx prisma migrate deploy  # run after deploy
```

### Docker / VPS

```bash
docker-compose up -d
npm run build
DATABASE_URL=... npx prisma migrate deploy
npm start
```

---

## Architecture Notes

### Maintenance Plans — Source Integrity

The system **never shows maintenance intervals without a verified source**.
Every plan item links to a `MaintenancePlanSourceDocument`. If no verified plan
exists for a vehicle, the UI shows:
> "Official maintenance plan not available for this exact vehicle."

Matching uses confidence scoring: EXACT / LIKELY / MANUAL REVIEW.

### Transfer Flow Security

1. Initiator enters recipient email
2. Secure token (`nanoid(32)`) generated and emailed to recipient
3. Recipient must log in with **matching email** to accept
4. All share links revoked on transfer completion
5. Full audit log entry created

### Share Links

- Tokenized with optional PIN (bcrypt-hashed)
- Configurable visibility: VIN, plate, costs, notes, documents
- Access count tracked with last-accessed timestamp
- Expiry enforced server-side

---

## What's Complete (v1)

- Auth (email/password, password reset)
- Multi-vehicle garage
- Full vehicle profile with all specs
- Maintenance history timeline
- Reminder system (date + mileage + recurring)
- Document upload and management
- Secure share links with visibility config
- Ownership transfer flow
- Official maintenance plans (VW Golf Mk7, Toyota Yaris, Skoda Octavia)
- Admin backoffice (plan management, source documents, audit trail)
- Daily notification cron jobs
- GDPR data export + account deletion
- PWA manifest + service worker
- Bilingual UI (English + Croatian)
- Tests (unit + integration)
- Docker Compose for local dev

---

## Future Extensions

- **OCR extraction** for uploaded service books and invoices
- **OBD-II integration** for automatic mileage sync
- **More maintenance plans** — expand verified plan database
- **Push notifications** — PWA push ready
- **Social login** — Google/Apple (NextAuth providers ready)
- **Fuel tracking** — hidden in v1, architected
- **Multi-language** — i18n architecture ready

---

## License

MIT
