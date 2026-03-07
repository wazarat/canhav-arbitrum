"use client";

import { useState, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { PoolCard } from "@/components/pool-card";
import { PoolCardSkeleton } from "@/components/pool-card-skeleton";
import { MintFaucet } from "@/components/mint-faucet";
import { usePublicPoolCount, usePublicPools } from "@/lib/pool-reader";
import {
  SECTORS,
  SECTOR_ICONS,
  getSector,
  type Sector,
} from "@/lib/constants";

export default function PoolsPage() {
  const { authenticated } = usePrivy();
  const [activeSector, setActiveSector] = useState<Sector | null>(null);

  const {
    data: poolCount = 0,
    isLoading: countLoading,
    error: countError,
  } = usePublicPoolCount();
  const { data: pools = [], isLoading: poolsLoading } =
    usePublicPools(poolCount);

  const loading = countLoading || poolsLoading;

  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sector of SECTORS) counts[sector] = 0;
    for (const pool of pools) {
      const sector = getSector(pool.productName);
      if (sector) counts[sector]++;
    }
    return counts;
  }, [pools]);

  const filteredPools = useMemo(() => {
    if (!activeSector) return pools;
    return pools.filter((p) => getSector(p.productName) === activeSector);
  }, [pools, activeSector]);

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

      {/* Sector filter tabs */}
      {!loading && pools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSector(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeSector === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            All ({pools.length})
          </button>
          {SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() =>
                setActiveSector(activeSector === sector ? null : sector)
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeSector === sector
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {SECTOR_ICONS[sector]} {sector} ({sectorCounts[sector]})
            </button>
          ))}
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
      ) : filteredPools.length === 0 ? (
        <p className="text-muted-foreground">
          No pools in this category yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
