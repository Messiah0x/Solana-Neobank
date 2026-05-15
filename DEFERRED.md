# Deferred — Paid Services & Production Requirements

Everything here is built and code-ready. These items need accounts/payment
before they go live. Come back to this file when ready to productionize.

---

## 🗄️ Database (Postgres)

**What it's for:** Storing wallets, yield positions, users, transactions.
Without it the backend API cannot save any data.

**Options when ready:**
- **Railway** — ~$5/month. Preferred. `railway.toml` is already configured.
  Deploy at railway.app → New Project → Deploy from GitHub → add Postgres plugin.
- **Supabase** — Free tier (500MB). Go to supabase.com → New Project →
  grab the `DATABASE_URL` and paste into Railway/hosting env vars.

**Env var needed:** `DATABASE_URL`

---

## 🚂 Backend Hosting (Railway)

**What it's for:** Running the Fastify API server so the frontend can call
real endpoints (wallet creation, balance, yield deposit/withdraw).

**When ready:** railway.app → New Project → Deploy from GitHub (Messiah0x/Solana-Neobank)
Railway will detect `railway.toml` automatically.

**Env vars needed on Railway:**
```
DATABASE_URL         = (from Postgres plugin above)
HELIUS_API_KEY       = (from helius.dev — free tier available)
SOLANA_NETWORK       = devnet
ENCRYPTION_SECRET    = (openssl rand -hex 32)
FRONTEND_URL         = https://solana-neobank-beta.vercel.app
NODE_ENV             = production
PORT                 = (Railway sets this automatically)
```

**Then:** Add `NEXT_PUBLIC_API_URL=<railway-url>` to Vercel env vars.

---

## 🪙 Helius RPC (API Key)

**What it's for:** Fast Solana RPC, WebSocket subscriptions, priority fee
estimation. Without it the app falls back to public RPC (slow, rate-limited).

**Cost:** Free tier (100k requests/day) is enough for devnet testing.
**Sign up:** helius.dev → create project → copy API key.

**Env var needed:** `HELIUS_API_KEY`

---

## 💳 Lithic (Card Issuing) — Phase 4

**What it's for:** Issuing virtual Visa cards to users, detecting spend,
triggering USDC settlement.

**When ready:** lithic.com → apply for sandbox access →
`LITHIC_API_KEY` env var in backend.

**Code location:** `packages/backend/src/services/card.service.ts` (to be built in Phase 4)

---

## 🪪 Persona (KYC) — Phase 5

**What it's for:** Identity verification before users get real cards and
move to mainnet USDC.

**When ready:** withpersona.com → create account → sandbox API key →
`PERSONA_API_KEY` + `PERSONA_TEMPLATE_ID` env vars.

**Code location:** `packages/backend/src/services/kyc.service.ts` (to be built in Phase 5)

---

## 🌐 Custom Domain — Phase 6

**What it's for:** `app.solbank.xyz` or similar instead of vercel.app.

**When ready:** Buy domain → add to Vercel project → configure DNS.

---

## ✅ Already Free / No Payment Needed

| Service | Status |
|---|---|
| Vercel (frontend hosting) | ✅ Live — free tier |
| Solana devnet | ✅ Free |
| Marginfi devnet | ✅ Free, permissionless |
| GitHub repo | ✅ Free |
| Next.js / Fastify code | ✅ Built |

---

## Build Order Reminder

- [x] Phase 1 — Core infrastructure (wallet, USDC balance, Helius RPC)
- [x] Phase 2 — Yield engine (Marginfi, live ticker)
- [ ] Phase 3 — Full dashboard (transaction history, polish)
- [ ] Phase 4 — Card integration (Lithic)
- [ ] Phase 5 — KYC & onboarding (Persona)
- [ ] Phase 6 — Production (mainnet, paid infra, real cards)
