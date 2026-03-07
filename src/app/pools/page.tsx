"use client";

import { usePrivy } from "@privy-io/react-auth";
import { PoolCard } from "@/components/pool-card";
import { PoolCardSkeleton } from "@/components/pool-card-skeleton";
import { MintFaucet } from "@/components/mint-faucet";
import { usePublicPoolCount, usePublicPools } from "@/lib/pool-reader";

export default function PoolsPage() {
  const { authenticated } = usePrivy();
  const {
    data: poolCount = 0,
    isLoading: countLoading,
    error: countError,
  } = usePublicPoolCount();
  const { data: pools = [], isLoading: poolsLoading } =
    usePublicPools(poolCount);

  const loading = countLoading || poolsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Pools</h1>
        <p className="text-muted-foreground">
          Browse open purchase pools and commit to meet supplier MOQs.
        </p>
      </div>

      {authenticated && <MintFaucet />}

      {countError && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          <p className="font-semibold">Failed to load pools</p>
          <p className="mt-1 text-red-400/80">
            {countError.message.includes("Missing")
              ? "Environment variables NEXT_PUBLIC_PURCHASE_POOL_ADDRESS and NEXT_PUBLIC_ALCHEMY_URL must be set."
              : `RPC error: ${countError.message}`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PoolCardSkeleton key={i} />
          ))}
        </div>
      ) : pools.length === 0 && !countError ? (
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
