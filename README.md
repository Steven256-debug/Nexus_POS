# Nexus POS — Enterprise Point of Sale & Inventory Management

A full-featured, production-grade POS and ERP system built for **Francis Amoako Ventures** (Ghana), supporting inventory management, multi-payment sales, returns, expense tracking, and offline resilience.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict) |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Auth** | NextAuth.js (Credentials + JWT) |
| **State** | Zustand, React Query |
| **UI** | TailwindCSS, shadcn/ui, Lucide Icons |
| **Charts** | Recharts |
| **Monitoring** | Sentry (optional) |
| **Offline** | IndexedDB + auto-sync engine |

## Features

- 🛒 **POS Terminal** — Barcode scanning, split payments (Cash/MoMo/Card), quotations, draft/hold sales
- 📦 **Inventory Management** — Products, categories, brands, units, variations, bulk import
- 💰 **Sales & Returns** — Complete sale lifecycle with invoice generation, refunds, and stock restoration
- 📊 **Dashboard** — Real-time KPIs, 30-day revenue/profit trends, low stock alerts
- 👥 **User Management** — Role-based access control (Admin/Employee), audit logging
- 💸 **Expense Tracking** — Quick expense recording with categorization
- 🌐 **Offline Support** — IndexedDB-backed offline sales with automatic sync on reconnection
- 🎨 **Premium UI** — Dark/light mode, glassmorphism, responsive design, keyboard shortcuts
- 🔒 **Security** — Rate limiting, CSP headers, Zod validation, soft deletes, RBAC middleware

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)

### Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd pos-system
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and generate a NEXTAUTH_SECRET:
   # openssl rand -base64 32
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) and log in with:
   - **Admin:** `admin@store.com` / `admin123`
   - **Cashier:** `cashier@store.com` / `employee123`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Jest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run type-check` | TypeScript type checking |
| `npm run backup` | Create database backup |

## Project Structure

```
src/
├── app/
│   ├── actions/        # Server actions (sales, inventory, users, etc.)
│   ├── api/            # API routes (auth, uploads, etc.)
│   ├── pos/            # POS terminal (decomposed components)
│   ├── page.tsx        # Dashboard (server component)
│   └── layout.tsx      # Root layout with nav + header
├── components/
│   ├── ui/             # shadcn/ui components (button, dialog, etc.)
│   ├── header.tsx      # Top bar with calculator, search, quick expense
│   └── navigation.tsx  # Sidebar + mobile bottom nav
├── lib/
│   ├── action-utils.ts # Unified ActionResult type + auth helpers
│   ├── auth.ts         # NextAuth configuration
│   ├── audit.ts        # Audit logging helper
│   ├── offline-db.ts   # IndexedDB wrapper for offline support
│   ├── offline-sync.ts # Auto-sync engine
│   ├── rate-limit.ts   # LRU rate limiter
│   ├── safe-math.ts    # Recursive descent expression evaluator
│   ├── validators.ts   # Zod validation schemas
│   └── prisma.ts       # Prisma client singleton
├── types/
│   └── index.ts        # Centralized TypeScript interfaces
└── __tests__/          # Unit tests (Jest)
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (with PgBouncer) |
| `DIRECT_URL` | ✅ | Direct PostgreSQL connection (for migrations) |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `NEXTAUTH_URL` | ✅ | Base URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry error tracking DSN |

## Keyboard Shortcuts (POS)

| Key | Action |
|---|---|
| `F2` | Cash Checkout |
| `F4` | Hold/Pause Sale |
| `F8` | Split Payment |
| `F9` | Create Quotation |
| `Ctrl+K` | Global Search |
| `Esc` | Close Modals |

## License

Private — Francis Amoako Ventures
