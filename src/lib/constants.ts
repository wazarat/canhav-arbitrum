export const USDC_DECIMALS = 6;

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
