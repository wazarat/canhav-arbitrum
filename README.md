# CanHav

> On-chain and off-chain intelligence for web3 research that moves markets.

CanHav is the research workspace for people building at the intersection of crypto and AI. We fuse on-chain ecosystem data with off-chain signals — governance, funding, hiring, partnerships, narrative — so researchers, traders, and AI builders can trade, invest, or train agents on a unified thesis.

**Live at [canhav.co](https://www.canhav.co) · [canhav.io](https://www.canhav.io)** — waitlist open.

Follow [@wazarat on X](https://x.com/wazarat) for product updates.

---

## What this repo contains

- **`src/app/(marketing)/`** — the public landing page at `canhav.co` / `canhav.io`. Waitlist-first, targeted at web3 researchers, traders, and AI builders.
- **`src/app/api/submissions/`** — lead-capture API that pushes new waitlist signups to HubSpot + Instantly and mirrors them to Upstash Redis.
- **`src/middleware.ts`** — locks the production domains down to just the landing page + `/api/submissions`. Everything else 302s to the waitlist.
- **`src/app/(platform)/`** — legacy app pages from a previous direction (Arbitrum Sepolia hackathon, group-purchasing prototype). Reachable in local dev for reference, blocked on the public domains by middleware.
- **`contracts/`** — Solidity contracts from the same hackathon era, kept as portfolio artifacts. Not powering the current website.

## Who it's for

- **Researchers** mapping ecosystems, stress-testing narratives, and shipping thesis-grade work.
- **Traders & investors** spotting regime shifts, monitoring flows, and sizing positions with off-chain context dashboards miss.
- **AI builders** training agents that reason over unified web3 intelligence — not fragmented APIs and scraped tweets.

## What's shipping next

1. **Now** — Waitlist & research. Founding cohort shapes the data model.
2. **Up next** — Unified on-chain + off-chain intelligence in a single queryable workspace.
3. **Up next** — Custom alerts and workflows on the signals that matter to each thesis.
4. **Later** — First-class agent integrations: structured exports and APIs for autonomous research and execution.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI |
| Lead capture | HubSpot CRM + Instantly.ai, mirrored to Upstash Redis (Vercel KV) |
| Hosting | Vercel (`canhav.co`, `canhav.io`) |
| Legacy on-chain | Solidity 0.8.24, OpenZeppelin, Foundry — Arbitrum Sepolia (see below) |

## Local Development

```bash
pnpm install
pnpm dev
```

The marketing landing renders at `/`. The legacy platform pages (`/pools`, `/my-commitments`, `/request-pool`, `/admin`) are reachable in local dev but blocked on the production domains by `src/middleware.ts`.

## Environment Variables

```env
# Lead capture
HUBSPOT_TOKEN=                      # HubSpot private app token (contacts + notes scopes)
INSTANTLY_API_KEY=                  # Instantly.ai API key
INSTANTLY_CAMPAIGN_ID=              # Campaign ID for the waitlist sequence
KV_REST_API_URL=                    # Upstash Redis URL (optional, mirror log)
KV_REST_API_TOKEN=                  # Upstash Redis token
ADMIN_API_SECRET=                   # Secret for /api/submissions GET (admin export)

# Legacy on-chain prototype (only needed to run the (platform) pages locally)
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_ALCHEMY_URL=
NEXT_PUBLIC_PURCHASE_POOL_ADDRESS=
NEXT_PUBLIC_MOCK_USDC_ADDRESS=
```

---

## Legacy: Arbitrum Sepolia group-purchasing prototype

The `contracts/` directory and `src/app/(platform)/` pages are artifacts from an earlier direction — a group-purchasing platform built for an Arbitrum hackathon. They are kept here for portfolio reasons and are **not** part of the current product.

- **Contract on Arbitrum Sepolia:** [`0x3b0cb807778cb900caec181c1ce1b0133dcf8cb8`](https://sepolia.arbiscan.io/address/0x3b0cb807778cb900caec181c1ce1b0133dcf8cb8)
- **Core contract:** `contracts/src/PurchasePool.sol` — on-chain escrow, up to 10 price tiers, early-committer rebates, deadline-based fulfillment/refund lifecycle, OpenZeppelin `ReentrancyGuard` + `SafeERC20` + `Ownable`, CEI ordering in `commit()`.
- **Test suite:** `contracts/test/PurchasePool.t.sol` — 50 Foundry tests covering pool creation, tiered pricing, fulfillment lifecycle, refunds, fee accounting, rebates, and `setDeadline` restrictions.
- **Frontend integration:** Privy for wallet auth with auto chain-switching to Arbitrum Sepolia, Wagmi/Viem for reads, custom `useGasOverrides` hook for Sepolia gas quirks, ERC-20 approve-then-commit flow.

### Contract development

```bash
cd contracts
forge build
forge test
```

### Deploy contracts

```bash
cd contracts
DEPLOYER_KEY=0x... forge script script/Deploy.s.sol \
  --rpc-url $NEXT_PUBLIC_ALCHEMY_URL --broadcast --slow
```
