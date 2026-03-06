"use client";

import { usePrivy } from "@privy-io/react-auth";
import { PoolCard } from "@/components/pool-card";
import { PoolCardSkeleton } from "@/components/pool-card-skeleton";
import { MintFaucet } from "@/components/mint-faucet";
import { usePoolCount, usePools } from "@/lib/hooks";

export default function PoolsPage() {
  const { authenticated } = usePrivy();
  const { data: count } = usePoolCount();
  const poolCount = count ? Number(count) : 0;
  const { pools, isLoading } = usePools(poolCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Pools</h1>
        <p className="text-muted-foreground">
          Browse open purchase pools and commit to meet supplier MOQs.
        </p>
      </div>

      {authenticated && <MintFaucet />}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PoolCardSkeleton key={i} />
          ))}
        </div>
      ) : pools.length === 0 ? (
        <p className="text-muted-foreground">
          No pools found. Deploy the contracts and seed pools to get started.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
