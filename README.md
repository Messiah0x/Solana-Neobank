# Solbank — Solana Neobank

A global neobank where users earn DeFi yield automatically, spend anywhere with a Visa card, and own their money non-custodially on Solana.

## Stack

| Layer | Technology |
|---|---|
| Blockchain | Solana (devnet → mainnet) |
| Stablecoin | USDC via Circle |
| Yield | Marginfi · Kamino |
| Card issuing | Lithic API |
| KYC | Persona API |
| Backend | TypeScript · Fastify · Railway |
| Frontend | Next.js 14 · Tailwind CSS · Framer Motion |
| Database | PostgreSQL · Prisma |
| RPC | Helius |

## Build Phases

- [x] **Phase 1** — Core infrastructure (wallet creation, USDC balance, Helius RPC)
- [ ] **Phase 2** — Yield engine (Marginfi auto-deposit, real-time APY display)
- [ ] **Phase 3** — Frontend dashboard (balance, yield ticker, transaction history)
- [ ] **Phase 4** — Card integration (Lithic sandbox, spend detection, instant settlement)
- [ ] **Phase 5** — KYC & onboarding (Persona, waitlist → full account)
- [ ] **Phase 6** — Production (mainnet, real cards, monitoring)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- [Helius API key](https://helius.dev) (free tier works for devnet)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in HELIUS_API_KEY, DATABASE_URL, ENCRYPTION_SECRET

# Generate Prisma client and push schema
npm run db:push

# Start both backend and frontend
npm run dev
```

Backend runs on `http://localhost:4000`
Frontend runs on `http://localhost:3000`

### API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/wallet/create` | Create a new Solana wallet for a user |
| `GET` | `/api/wallet/:userId` | Get wallet info |
| `GET` | `/api/wallet/:userId/balance` | Get USDC + SOL balances |
| `GET` | `/api/wallet/:userId/transactions` | Get recent on-chain transactions |
| `GET` | `/api/health` | Service health check |

### Environment Variables

See `.env.example` for all required variables.

**Critical:** `ENCRYPTION_SECRET` must be at least 32 characters. Private keys are encrypted with AES-256-GCM before being stored in the database.

## Architecture Decisions (Phase 1)

**Private key custody model:** Server-side encrypted storage with AES-256-GCM. Keys are never stored or transmitted in plaintext. This is a semi-custodial model for Phase 1 simplicity — Phase 5 will evaluate MPC or user-held key options.

**RPC provider:** Helius over public RPC for reliability, priority fee estimation, and WebSocket subscriptions.

**Parallel fetching:** USDC and SOL balances are always fetched in parallel (`Promise.all`). No sequential awaits on independent blockchain calls.
