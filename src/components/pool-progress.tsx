"use client";

import { Progress } from "@/components/ui/progress";
import { formatUsdc, getTieredPricing } from "@/lib/constants";
import type { PoolData } from "@/lib/hooks";

export function PoolProgress({ pool }: { pool: PoolData }) {
  const pricing = getTieredPricing(pool.productName);
  const bulkThreshold = pricing
    ? BigInt(pricing.tiers.find((t) => t.mandatory)?.minUnits ?? Number(pool.moq))
    : pool.moq;

  const target = bulkThreshold > pool.moq ? bulkThreshold : pool.moq;
  const pct = target > 0n ? Number((pool.totalUnits * 100n) / target) : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">
          {pool.totalUnits.toString()} / {target.toString()} units ({Math.min(pct, 100)}%)
        </span>
      </div>
      <Progress value={Math.min(pct, 100)} className="h-3" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Price per unit</span>
          <p className="font-medium">{formatUsdc(pool.pricePerUnit)} mUSDC</p>
        </div>
        <div>
          <span className="text-muted-foreground">Total deposited</span>
          <p className="font-medium">{formatUsdc(pool.totalDeposited)} mUSDC</p>
        </div>
      </div>
    </div>
  );
}
