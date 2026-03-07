export const USDC_DECIMALS = 6;

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

export function parseUsdc(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  return BigInt(whole + paddedFrac);
}
