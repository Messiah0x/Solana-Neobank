# Deferred — Production Requirements

Items that need accounts, payment, or a dashboard action before they go live.

---

## 🚨 Railway public domain (action required, ~1 minute)

The backend container is healthy (internal healthchecks pass), but the public
domain `solana-neobank-production.up.railway.app` returns
**502 "Application failed to respond"** for everyone. This is a domain
target-port mismatch, fixable only in the Railway dashboard:

1. Railway → **Solana-Neobank** service → **Settings** → **Networking**
2. Find the public domain entry → edit → set the **target port** to match
   the port the app listens on (the logs show `Server listening at
   http://[::]:8080` → use **8080**)
3. Verify at `https://solana-neobank-beta.vercel.app/api/status` — it should
   report `"backendStatus": 200`

Until then the frontend runs in resilience mode (balances/history read
directly from Solana RPC; yield deposits unavailable).

## 💳 Card issuing (Lithic)

Real Visa cards. The card page currently simulates purchases. Needs a Lithic
sandbox account, then production agreement. Target: Q3 2026.

## 🪪 KYC (Persona)

Required before mainnet. Persona sandbox is free to start.

## 🌐 Mainnet launch

- Switch `SOLANA_NETWORK=mainnet-beta` and the Helius mainnet RPC
- Use mainnet USDC mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- MarginFi production config is already handled by `getConfig('production')`
- Revisit rate limits and add real authentication (Privy access tokens
  verified server-side) before real funds are involved

## 💰 Already live

- Railway backend + Postgres (paid trial — watch the credit balance)
- Vercel frontend (auto-deploys `main`)
- Privy auth (Google/GitHub)
- Revenue: 10% performance fee on yield earned (disclosed in UI),
  Avanor Reserve premium waitlist collecting signups
