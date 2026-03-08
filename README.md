# CanHav Group Pool

![image alt](https://github.com/wazarat/canhav-arbitrum/blob/d3f619c270e006e29a9fb4d02647fda5a2983363/CanHavArbitrum%20pitch.png)

A group-purchasing platform where small businesses pool funds together to meet supplier minimum order quantities (MOQs). Built on **Arbitrum Sepolia** with on-chain escrow and tiered pricing.

Live at [canhav.io](https://www.canhav.io)

## How It Works

1. **Browse Pools** - Find a product pool your business needs (coffee beans, cups, packaging, etc.).
2. **Commit Funds** - Approve and deposit mUSDC for the quantity you want. Tokens are held in escrow by the smart contract.
3. **Tiers Unlock** - As more businesses commit, the pool crosses pricing thresholds and everyone gets a cheaper rate.
4. **Deadline Resolves** - The pool stays open until its deadline. If the MOQ is met, the order is locked in and fulfilled. If not, every buyer can claim a full refund.

## Smart Contract

The core of the platform is `PurchasePool.sol`, a single Solidity contract deployed on Arbitrum Sepolia. It handles all the financial logic on-chain.

### Pool Lifecycle

```
Open ──── deadline passes ──┬── MOQ met ────► Fulfilled ──► Withdrawn (supplier paid)
                            └── MOQ not met ► Expired (buyers claim refunds)
```

- **Open**: The pool accepts commitments. Even after the MOQ threshold is reached, the pool stays open so buyers can keep committing toward higher tiers with better pricing.
- **Fulfilled**: The deadline has passed and enough units were committed. The admin can withdraw funds to pay the supplier. A platform fee (configurable, max 10%) is deducted.
- **Expired**: The deadline passed without meeting the MOQ. Every buyer can call `claimRefund()` to get their full deposit back.
- **Withdrawn**: Funds have been sent to the supplier. The order is being fulfilled.

### On-Chain Tiered Pricing

Each pool stores up to 10 price tiers directly in the contract. Tiers have:

| Field | Description |
|---|---|
| `minUnits` | Unit threshold to enter this tier |
| `pricePerUnit` | Cost per unit at this tier (in token smallest units) |
| `mandatory` | If `true`, reaching this tier locks in fulfillment |

When a buyer commits, the contract looks up the active tier based on the pool's total units after the commit and charges accordingly. Lower tiers are optional (the pool may not execute), while higher tiers lock in fulfillment.

### Key Functions

| Function | Who | What it does |
|---|---|---|
| `createPool(...)` | Owner | Creates a new pool with product name, tiers, deadline, and token |
| `commit(poolId, units)` | Buyer | Commits units to a pool, transferring the calculated cost from the buyer |
| `claimRefund(poolId)` | Buyer | Claims a full refund from an expired pool |
| `withdrawFunds(poolId)` | Owner | Withdraws funds from a fulfilled pool to pay the supplier (minus fee) |
| `setDeadline(poolId, newDeadline)` | Owner | Extends or changes a pool's deadline |
| `setFeeBps(bps)` | Owner | Updates the platform fee (capped at 10%) |

### Escrow and Safety

- All buyer funds are held by the contract itself. No intermediary wallet.
- Commitments are tracked per buyer per pool (`units`, `deposited`, `refunded`).
- Refunds are guaranteed for expired pools. The contract holds the tokens until claimed.
- The contract uses OpenZeppelin's `SafeERC20` for token transfers and `Ownable` for admin access.

### Token

The platform uses `MockUSDC` (mUSDC), an ERC-20 test stablecoin with 6 decimals. Anyone can mint tokens to themselves using the faucet on the site for testing purposes.

## Why Arbitrum

Arbitrum is an Ethereum Layer 2 rollup. Transactions settle on Ethereum for security but execute on Arbitrum for speed and low cost. This means:

- **Low gas fees** - Committing to a pool costs a fraction of a cent, making it practical for smaller transactions.
- **Fast confirmations** - Transactions confirm in seconds, not minutes.
- **Ethereum security** - All state is anchored to Ethereum L1. The escrow is as secure as Ethereum itself.
- **EVM compatible** - Standard Solidity, standard tools (Foundry, Wagmi, Viem).

The testnet deployment uses **Arbitrum Sepolia** (chain ID 421614).

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity 0.8.24, OpenZeppelin, Foundry (Forge) |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI |
| Web3 | Wagmi, Viem, Privy (auth + embedded wallets) |
| Data | On-chain reads via Alchemy RPC, Upstash Redis (Vercel KV) for off-chain form data |
| Hosting | Vercel |

## Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=           # Privy app ID for authentication
NEXT_PUBLIC_ALCHEMY_URL=            # Alchemy RPC URL for Arbitrum Sepolia
NEXT_PUBLIC_PURCHASE_POOL_ADDRESS=  # Deployed PurchasePool contract address
NEXT_PUBLIC_MOCK_USDC_ADDRESS=      # Deployed MockUSDC contract address
KV_REST_API_URL=                    # Upstash Redis URL
KV_REST_API_TOKEN=                  # Upstash Redis token
```

## Local Development

```bash
pnpm install
pnpm dev
```

### Contract Development

```bash
cd contracts
forge build
forge test
```

### Deploy Contracts

```bash
cd contracts
DEPLOYER_KEY=0x... forge script script/Deploy.s.sol \
  --rpc-url $NEXT_PUBLIC_ALCHEMY_URL --broadcast --slow
```

### Seed Pools

```bash
cd contracts
DEPLOYER_KEY=0x... POOL_ADDRESS=0x... TOKEN_ADDRESS=0x... \
  forge script script/SeedCoffeeShopPools.s.sol \
  --rpc-url $NEXT_PUBLIC_ALCHEMY_URL --broadcast --slow
```
