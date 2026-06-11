# Avanor — Private Banking on Solana

A non-custodial neobank on Solana: earn DeFi yield automatically, simulate card
spending (Visa integration coming), and hold your own keys — wrapped in a
private-banking experience.

**Live beta (devnet):** https://solana-neobank-beta.vercel.app

## Stack

| Layer | Technology |
|---|---|
| Blockchain | Solana (devnet → mainnet) |
| Auth & wallets | Privy (embedded MPC wallets, Google/GitHub login) |
| Stablecoin | USDC |
| Yield | MarginFi lending pool |
| Swaps | Jupiter v6 |
| Backend | TypeScript · Fastify · Railway |
| Frontend | Next.js 14 (App Router) · Tailwind CSS · Framer Motion · Vercel |
| Database | PostgreSQL · Prisma |
| RPC | Helius |

## Architecture

```
Browser ── same-origin /api/backend/* ──▶ Vercel (Next.js rewrites)
                                              │
                                              ▼
                                   Railway (Fastify + Prisma)
                                              │
                                  Solana devnet (Helius RPC)
```

- **Same-origin API proxy:** the browser never talks to Railway directly.
  Next.js rewrites `/api/backend/*` to the backend, eliminating CORS and
  mobile cross-domain flakiness. Configure the backend origin with
  `NEXT_PUBLIC_API_URL`.
- **Non-custodial signing:** users sign with their Privy embedded wallet in
  the browser. For yield, the backend *prepares* unsigned MarginFi
  transactions (`/api/yield/deposit/prepare`), the client signs and sends,
  and the backend records the position only after verifying the signature
  on-chain (`/confirm`). Private keys never touch the server.
- **Revenue model:** a 10% performance fee on yield earned (never principal),
  disclosed in the UI. The APY shown to users is always net of fees.

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- [Helius API key](https://helius.dev) (free tier works for devnet)
- [Privy app](https://privy.io) (app ID for the frontend)

### Setup

```bash
npm install

# Backend env (packages/backend/.env):
#   DATABASE_URL, HELIUS_API_KEY, ENCRYPTION_SECRET (32+ chars),
#   SOLANA_NETWORK=devnet
# Frontend env (packages/frontend/.env.local):
#   NEXT_PUBLIC_PRIVY_APP_ID, NEXT_PUBLIC_API_URL=http://localhost:4000,
#   NEXT_PUBLIC_HELIUS_RPC

npm run db:push   # generate Prisma client + push schema
npm run dev       # backend :4000, frontend :3000
```

### API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (includes DB connectivity) |
| `POST` | `/api/wallet/register` | Link a Privy wallet public key to a user |
| `GET` | `/api/wallet/:userId` | Wallet info |
| `GET` | `/api/wallet/:userId/balance` | USDC + SOL balances |
| `GET` | `/api/wallet/:userId/transactions` | Recent on-chain transactions |
| `GET` | `/api/yield/apy` | Current net APY (cached 5 min) |
| `GET` | `/api/yield/:userId` | User's yield position |
| `POST` | `/api/yield/deposit/prepare` | Build unsigned deposit tx (client signs) |
| `POST` | `/api/yield/deposit/confirm` | Verify signature on-chain, record position |
| `POST` | `/api/yield/withdraw/prepare` | Build unsigned withdraw tx |
| `POST` | `/api/yield/withdraw/confirm` | Verify and update position |

All endpoints are rate-limited per IP (120 req/min).

## Deployment notes

- **Vercel (frontend):** auto-deploys from `main`. `NEXT_PUBLIC_*` vars are
  baked at build time — changing them requires a redeploy.
- **Railway (backend):** auto-deploys from `main` via `railway.toml`. The
  server binds `::` (dual-stack) because Railway's public edge proxy reaches
  containers over IPv6. The public domain's **target port must match the
  `PORT` Railway injects** (Settings → Networking) or public traffic 502s
  while healthchecks pass.

## Product status

- [x] Privy auth (Google/GitHub) + embedded Solana wallets
- [x] Balances, send/receive, Jupiter SOL→USDC swap
- [x] MarginFi yield: non-custodial deposit/withdraw, live net APY
- [x] Card page with simulated purchases + Double or Nothing coin flip
      (provably fair 50/50, `crypto.getRandomValues`)
- [x] Avanor Reserve premium waitlist
- [ ] Real Visa card issuing (Lithic) — Q3 2026
- [ ] KYC (Persona) and mainnet launch
