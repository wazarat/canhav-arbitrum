export const USDC_DECIMALS = 6;

export const PLATFORM_FEE_BPS = 250; // 2.5 % — must match the deployed contract's feeBps
export const PLATFORM_FEE_PCT = PLATFORM_FEE_BPS / 100; // 2.5

export type Sector = "Coffee Beans" | "Food Ingredients" | "Beverage Service Supplies" | "Food Packaging";

export const SECTORS: Sector[] = [
  "Coffee Beans",
  "Food Ingredients",
  "Beverage Service Supplies",
  "Food Packaging",
];

export const SECTOR_ICONS: Record<Sector, string> = {
  "Coffee Beans": "☕",
  "Food Ingredients": "🌾",
  "Beverage Service Supplies": "🥤",
  "Food Packaging": "📦",
};

const SECTOR_PRODUCTS: Record<Sector, string[]> = {
  "Coffee Beans": [
    "Espresso Blend Coffee Beans",
    "Arabica House Blend Coffee Beans",
    "Arabica Espresso Blend Coffee Beans",
    "Ethiopian Single-Origin Beans",
    "Ethiopian Single-Origin Coffee Beans",
    "Colombian Single-Origin Coffee Beans",
    "Guatemalan Single-Origin Coffee Beans",
    "Kenyan Single-Origin Coffee Beans",
    "Costa Rican Single-Origin Coffee Beans",
    "Light Roast Coffee Beans",
    "Medium Roast Coffee Beans",
    "Dark / French Roast Coffee Beans",
    "Decaf Swiss Water Process Coffee Beans",
    "Green Unroasted Coffee Beans",
  ],
  "Food Ingredients": [
    "All-Purpose Flour",
    "Basmati Rice",
    "Olive Oil",
  ],
  "Beverage Service Supplies": [
    "Hot Cups",
    "Hot Paper Cups 12oz (1000/case)",
    "Hot Paper Cups 16oz (1000/case)",
    "Cold Clear Cups 16oz (1000/case)",
    "Compostable Hot Cups 12oz (500/case)",
    "Lids",
    "Flat Lids for 12-16oz Cups",
    "Flat Lids for 12–16oz Cups",
    "Eco Paper Straws",
  ],
  "Food Packaging": [
    "3-Compartment Clamshell Boxes (200/case)",
    "Deli Soup Containers 32oz w/Lids (250/case)",
    "Aluminum Foil Pans Half-Size (100/case)",
    "Kraft Paper Carry-Out Bags (500/case)",
    "Takeout Bags with Handles (250/case)",
    "Foil & Parchment Food Wrap Rolls",
    "Bulk Napkins (8000/case)",
    "Compostable Cutlery Kits (250/case)",
  ],
};

const productToSectorMap = new Map<string, Sector>();
for (const [sector, products] of Object.entries(SECTOR_PRODUCTS)) {
  for (const product of products) {
    productToSectorMap.set(product.toLowerCase(), sector as Sector);
  }
}

export function getSector(productName: string): Sector | null {
  const exact = productToSectorMap.get(productName.toLowerCase());
  if (exact) return exact;

  const lower = productName.toLowerCase();
  for (const [sector, products] of Object.entries(SECTOR_PRODUCTS)) {
    for (const product of products) {
      if (lower.includes(product.toLowerCase()) || product.toLowerCase().includes(lower)) {
        return sector as Sector;
      }
    }
  }

  if (lower.includes("coffee") || lower.includes("roast")) return "Coffee Beans";
  if (lower.includes("flour") || lower.includes("rice") || lower.includes("oil")) return "Food Ingredients";
  if (lower.includes("cup") || lower.includes("lid") || lower.includes("straw")) return "Beverage Service Supplies";
  if (lower.includes("bag") || lower.includes("napkin") || lower.includes("foil") || lower.includes("cutlery") || lower.includes("container") || lower.includes("clamshell") || lower.includes("wrap")) return "Food Packaging";

  return null;
}

export interface PriceTier {
  label: string;
  minUnits: number;
  maxUnits: number | null;
  priceUsd: number;
  mandatory: boolean;
}

export interface TieredPricing {
  basePriceUsd: number;
  tiers: PriceTier[];
  poolDurationDays: number;
  shipmentDaysAfterClose: number;
}

export const TIERED_PRICING: Record<string, TieredPricing> = {
  "ethiopian single-origin coffee beans": {
    basePriceUsd: 10.80,
    tiers: [
      {
        label: "Starter",
        minUnits: 1,
        maxUnits: 79,
        priceUsd: 10.80,
        mandatory: false,
      },
      {
        label: "Bulk",
        minUnits: 80,
        maxUnits: 399,
        priceUsd: 8.98,
        mandatory: true,
      },
      {
        label: "Wholesale",
        minUnits: 400,
        maxUnits: null,
        priceUsd: 8.08,
        mandatory: true,
      },
    ],
    poolDurationDays: 7,
    shipmentDaysAfterClose: 10,
  },
};

export function getTieredPricing(productName: string): TieredPricing | null {
  return TIERED_PRICING[productName.toLowerCase()] ?? null;
}

export function getActiveTier(pricing: TieredPricing, totalUnits: number): PriceTier {
  for (let i = pricing.tiers.length - 1; i >= 0; i--) {
    if (totalUnits >= pricing.tiers[i].minUnits) return pricing.tiers[i];
  }
  return pricing.tiers[0];
}

export function getDiscountPct(basePriceUsd: number, tierPriceUsd: number): number {
  if (basePriceUsd <= 0) return 0;
  return Math.round(((basePriceUsd - tierPriceUsd) / basePriceUsd) * 10000) / 100;
}

export const POOL_STATUS_LABELS: Record<number, string> = {
  0: "Open",
  1: "Fulfilled",
  2: "Expired",
  3: "Withdrawn",
};

export const POOL_STATUS_COLORS: Record<number, string> = {
  0: "bg-green-500/20 text-green-400 border-green-500/30",
  1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  2: "bg-red-500/20 text-red-400 border-red-500/30",
  3: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function formatUsdc(amount: bigint): string {
  const whole = amount / BigInt(10 ** USDC_DECIMALS);
  const frac = amount % BigInt(10 ** USDC_DECIMALS);
  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export const ACTIVE_POOL_IDS = new Set([2, 3, 5, 12, 17, 20]);
export const CLOSED_POOL_IDS = new Set([0, 7, 8, 9, 14, 19]);

export interface ClosedPoolMeta {
  source: string;
  region: string;
  closureReason: string;
  rating: number;
  totalBuyers: number;
  totalUnitsCommitted: number;
  closedDate: string;
}

export const CLOSED_POOL_META: Record<number, ClosedPoolMeta> = {
  0: {
    source: "Fazenda Santa Inês, Minas Gerais",
    region: "Brazil",
    closureReason: "Pool successfully fulfilled — order shipped to all 12 participants.",
    rating: 4.5,
    totalBuyers: 12,
    totalUnitsCommitted: 120,
    closedDate: "2026-02-20",
  },
  7: {
    source: "Counter Culture Coffee, Durham NC",
    region: "United States",
    closureReason: "Pool successfully fulfilled — light roast delivered to 9 cafes.",
    rating: 4.2,
    totalBuyers: 9,
    totalUnitsCommitted: 85,
    closedDate: "2026-02-25",
  },
  8: {
    source: "Intelligentsia Coffee, Chicago",
    region: "United States",
    closureReason: "MOQ not met within deadline — all deposits refunded.",
    rating: 3.0,
    totalBuyers: 6,
    totalUnitsCommitted: 45,
    closedDate: "2026-02-18",
  },
  9: {
    source: "Stumptown Coffee Roasters, Portland",
    region: "United States",
    closureReason: "Pool successfully fulfilled — dark roast delivered across 15 businesses.",
    rating: 4.8,
    totalBuyers: 15,
    totalUnitsCommitted: 130,
    closedDate: "2026-02-28",
  },
  14: {
    source: "Dart Container Corporation",
    region: "United States",
    closureReason: "Pool successfully fulfilled — 600 cases delivered across 22 businesses.",
    rating: 4.0,
    totalBuyers: 22,
    totalUnitsCommitted: 600,
    closedDate: "2026-02-10",
  },
  19: {
    source: "Durable Packaging International",
    region: "United States",
    closureReason: "Supplier discontinued this SKU. Deposits refunded to all 8 participants.",
    rating: 2.5,
    totalBuyers: 8,
    totalUnitsCommitted: 180,
    closedDate: "2026-01-30",
  },
};

export function getClosedPoolMeta(poolId: number): ClosedPoolMeta | null {
  return CLOSED_POOL_META[poolId] ?? null;
}

export type PoolUIStatus = "Active" | "Evaluating" | "Closed";

export const POOL_UI_STATUSES: PoolUIStatus[] = ["Active", "Evaluating", "Closed"];

export function getPoolUIStatus(poolId: number, onChainStatus: number): PoolUIStatus {
  if (ACTIVE_POOL_IDS.has(poolId)) {
    return onChainStatus >= 1 ? "Closed" : "Active";
  }
  if (CLOSED_POOL_IDS.has(poolId)) return "Closed";
  return "Evaluating";
}

export function parseUsdc(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  return BigInt(whole + paddedFrac);
}
