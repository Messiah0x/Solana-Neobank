# Solbank — Project Tracker

> Solana-native neobank · Built with TypeScript, Next.js 14, Fastify, Solana web3.js, Marginfi

---

## 🔗 Quick Links

| Resource | Link |
|---|---|
| GitHub Repository | https://github.com/Messiah0x/Solana-Neobank |
| Vercel (Live App) | https://solana-neobank-beta.vercel.app |
| Railway (Backend) | _Not deployed yet — see Deferred_ |
| Figma / Design | _Add link_ |
| OneDrive — Root Folder | _Paste your OneDrive folder link here_ |

---

## 📁 OneDrive File Index

> Paste each file's OneDrive share link in the **Link** column.

### Root

| File | Purpose | OneDrive Link |
|---|---|---|
| `package.json` | Monorepo workspaces, concurrently dev script | _Add link_ |
| `.env.example` | All environment variable documentation | _Add link_ |
| `.gitignore` | Ignored files (node_modules, .env, .next, dist) | _Add link_ |
| `vercel.json` | Monorepo frontend deploy config for Vercel | _Add link_ |
| `railway.toml` | Backend deploy config for Railway | _Add link_ |
| `DEFERRED.md` | Paid services to revisit later | _Add link_ |

### Backend — `packages/backend/`

| File | Purpose | OneDrive Link |
|---|---|---|
| `package.json` | Backend dependencies (Fastify, Prisma, Solana, Marginfi) | _Add link_ |
| `prisma/schema.prisma` | Database schema: User, Wallet, YieldPosition | _Add link_ |
| `src/server.ts` | Fastify server entry point | _Add link_ |
| `src/lib/encryption.ts` | AES-256-GCM private key encryption | _Add link_ |
| `src/lib/helius.ts` | Helius RPC connection + priority fee estimation | _Add link_ |
| `src/lib/prisma.ts` | Singleton Prisma client | _Add link_ |
| `src/lib/marginfi.ts` | Server-side Marginfi wallet adapter | _Add link_ |
| `src/services/solana.service.ts` | Keypair gen, USDC/SOL balance, transactions | _Add link_ |
| `src/services/wallet.service.ts` | Create/get wallet, balances | _Add link_ |
| `src/services/yield.service.ts` | APY fetch, deposit, withdraw, earned calc | _Add link_ |
| `src/routes/wallet.ts` | POST /create, GET /:userId, /balance, /transactions | _Add link_ |
| `src/routes/yield.ts` | GET /apy, GET /:userId, POST /deposit, /withdraw | _Add link_ |
| `src/routes/health.ts` | GET /health (Solana slot + DB check) | _Add link_ |

### Frontend — `packages/frontend/`

| File | Purpose | OneDrive Link |
|---|---|---|
| `package.json` | Frontend dependencies (Next.js, Framer Motion, SWR) | _Add link_ |
| `next.config.mjs` | Webpack fallbacks for Solana browser compat | _Add link_ |
| `tailwind.config.ts` | Design tokens: colors, fonts | _Add link_ |
| `app/layout.tsx` | Root layout: fonts, viewport, safe area config | _Add link_ |
| `app/globals.css` | Base styles, safe area utilities, scrollbar | _Add link_ |
| `app/page.tsx` | Landing / marketing page | _Add link_ |
| `app/dashboard/page.tsx` | Main dashboard — mobile-first layout | _Add link_ |
| `lib/api.ts` | Axios client + all API functions | _Add link_ |
| `components/layout/Sidebar.tsx` | Desktop sidebar nav (hidden on mobile) | _Add link_ |
| `components/layout/Header.tsx` | Top bar with logo (mobile) and profile | _Add link_ |
| `components/layout/MobileNav.tsx` | iPhone bottom tab bar with safe area | _Add link_ |
| `components/dashboard/BalanceHero.tsx` | Gradient hero card with USDC balance + yield badge | _Add link_ |
| `components/dashboard/QuickActions.tsx` | 4-button action grid (Add/Send/Earn/More) | _Add link_ |
| `components/dashboard/ActivityFeed.tsx` | Transaction list with skeleton loading | _Add link_ |
| `components/wallet/WalletCard.tsx` | Wallet creation card | _Add link_ |
| `components/wallet/BalanceDisplay.tsx` | USDC + SOL balance display | _Add link_ |
| `components/yield/YieldCard.tsx` | Yield engine card (pre/post deposit) | _Add link_ |
| `components/yield/YieldTicker.tsx` | Live per-digit slot machine earnings ticker | _Add link_ |
| `components/yield/DepositModal.tsx` | Deposit bottom sheet with projections | _Add link_ |

---

## 🏗️ Build Phases

### Phase 1 — Core Wallet ✅
- [x] Monorepo scaffolding (npm workspaces)
- [x] Solana keypair generation
- [x] AES-256-GCM private key encryption at rest
- [x] USDC + SOL balance fetching (Helius RPC)
- [x] Fastify backend with Prisma schema
- [x] Next.js 14 frontend with Tailwind design system
- [x] Vercel deployment (live at solana-neobank-beta.vercel.app)

### Phase 2 — Yield Engine ✅
- [x] Marginfi server-side wallet adapter
- [x] Deposit / withdraw USDC to Marginfi
- [x] Live APY fetch with 8.4% fallback
- [x] Real-time earnings ticker (per-digit slot animation)
- [x] Deposit modal with daily/monthly/yearly projections
- [x] Earned yield calculation: `principal × APY × elapsed/year`

### Phase 3 — Mobile-First UI ✅
- [x] iPhone bottom navigation bar (safe area inset)
- [x] BalanceHero gradient card (CIBC/RBC style)
- [x] QuickActions button grid
- [x] ActivityFeed transaction list
- [x] Responsive dashboard (single col mobile, 2-col desktop)
- [x] Auto-loads existing wallet on page mount
- [x] Dynamic viewport height (`100dvh`) for Safari

### Phase 4 — Debit Card 🔜
- [ ] Lithic card issuing API integration
- [ ] Virtual card creation per user
- [ ] Card details screen (PAN, CVV, expiry)
- [ ] Transaction sync from card to activity feed
- **Requires:** Lithic account + API key

### Phase 5 — KYC & Auth 🔜
- [ ] Persona KYC flow (identity verification)
- [ ] Replace demo user ID with real authentication (NextAuth or Clerk)
- [ ] User onboarding flow (email → KYC → wallet auto-create)
- **Requires:** Persona account + API key

### Phase 6 — Production 🔜
- [ ] Railway backend deployment (PostgreSQL + Fastify)
- [ ] Real Helius API key (priority fees, webhooks)
- [ ] Custom domain
- [ ] Mainnet USDC mint (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)
- [ ] Security audit

---

## 💳 Deferred — Paid Services

> All items below require accounts / payment. Tracked here to revisit.

| Service | Purpose | Phase | Est. Cost |
|---|---|---|---|
| **Railway** | Backend hosting + PostgreSQL | 6 | ~$5/mo |
| **Helius** | Fast Solana RPC + priority fees + webhooks | 1 (upgrade) | Free tier available |
| **Marginfi** | Yield protocol (devnet works free, mainnet needs funds) | 2 | Gas fees only |
| **Lithic** | Virtual debit card issuing | 4 | Per-transaction fee |
| **Persona** | KYC / identity verification | 5 | Per-verification fee |
| **Custom Domain** | e.g. solbank.app | 6 | ~$12/yr |
| **Vercel Pro** | Remove hobby limits, custom domain | 6 | $20/mo |

---

## 🔧 Environment Variables

> Copy `.env.example` and fill in real values for each environment.

| Variable | Used By | Where to Get |
|---|---|---|
| `DATABASE_URL` | Prisma / backend | Railway Postgres connection string |
| `ENCRYPTION_SECRET` | AES-256 key encryption | Generate: `openssl rand -hex 32` |
| `HELIUS_API_KEY` | Solana RPC | helius.dev dashboard |
| `SOLANA_NETWORK` | RPC selection | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_API_URL` | Frontend → backend | Railway backend URL |
| `LITHIC_API_KEY` | Card issuing (Phase 4) | Lithic dashboard |
| `PERSONA_API_KEY` | KYC (Phase 5) | Persona dashboard |

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#0A0E1A` | Page background |
| Surface | `#0F1322` | Cards, panels |
| Accent | `#0066FF` | Primary buttons, links, highlights |
| Success | `#10B981` | Yield green, positive states |
| Error | `#EF4444` | Failed transactions, errors |
| Font — Heading | Space Grotesk | Titles, logo |
| Font — Body | Inter | UI text |
| Font — Mono | Geist Mono | Balances, addresses, amounts |

---

## 📝 Notes

- **Demo user:** `demo-user-001` — hardcoded until Phase 5 (real auth)
- **USDC devnet mint:** `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **USDC mainnet mint:** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **Next.js config:** Must use `.mjs` (not `.ts`) — Next.js 14 doesn't support TypeScript config
- **Safe area:** `viewportFit: 'cover'` in layout + `env(safe-area-inset-bottom)` in MobileNav

---

_Last updated: Phase 3 complete_
