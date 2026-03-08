"use client";

import { Progress } from "@/components/ui/progress";
import { formatUsdc } from "@/lib/constants";
import { usePoolTiers, getOnChainActiveTierPrice } from "@/lib/hooks";
import type { PoolData } from "@/lib/hooks";

export function PoolProgress({ pool }: { pool: PoolData }) {
  const { data: tiers } = usePoolTiers(pool.id);

  const target = pool.moq;
  const pct = target > 0n ? Number((pool.totalUnits * 100n) / target) : 0;

  const currentPrice = tiers
    ? getOnChainActiveTierPrice(tiers, pool.totalUnits > 0n ? pool.totalUnits : 1n)
    : pool.pricePerUnit;

  const moqMet = pool.totalUnits >= target;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-foreground/70">Progress</span>
        <span className="font-semibold">
          {pool.totalUnits.toString()} / {target.toString()} units
          <span className="text-primary font-bold ml-1.5">({Math.min(pct, 100)}%)</span>
        </span>
      </div>
      <div className="relative">
        <Progress value={Math.min(pct, 100)} className="gradient-progress" />
        {pct > 0 && pct < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-md shadow-primary/30"
            style={{ left: `calc(${Math.min(pct, 100)}% - 8px)` }}
          />
        )}
      </div>
      {moqMet && pool.status === 0 && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
          <p className="text-sm font-semibold text-emerald-400">
            MOQ met. Fulfillment is locked in
          </p>
          <p className="text-xs text-emerald-400/70 mt-0.5">
            Pool stays open until the deadline. Keep committing for better tier pricing.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Current price/unit</span>
          <p className="font-semibold text-primary">{formatUsdc(currentPrice)} mUSDC</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Total deposited</span>
          <p className="font-semibold">{formatUsdc(pool.totalDeposited)} mUSDC</p>
        </div>
      </div>
    </div>
  );
}
