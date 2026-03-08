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
  POOL_UI_STATUSES,
  getSector,
  getPoolUIStatus,
  type Sector,
  type PoolUIStatus,
} from "@/lib/constants";

const STATUS_COLORS: Record<PoolUIStatus, string> = {
  Active: "bg-emerald-500",
  Evaluating: "bg-amber-500",
  Closed: "bg-zinc-500",
};

export default function PoolsPage() {
  const { authenticated } = usePrivy();
  const [activeSector, setActiveSector] = useState<Sector | null>(null);
  const [activeStatus, setActiveStatus] = useState<PoolUIStatus | null>(null);

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

  const statusCounts = useMemo(() => {
    const counts: Record<PoolUIStatus, number> = { Active: 0, Evaluating: 0, Closed: 0 };
    for (const pool of pools) {
      counts[getPoolUIStatus(pool.id, pool.status)]++;
    }
    return counts;
  }, [pools]);

  const filteredPools = useMemo(() => {
    let result = pools;
    if (activeSector) {
      result = result.filter((p) => getSector(p.productName) === activeSector);
    }
    if (activeStatus) {
      result = result.filter((p) => getPoolUIStatus(p.id, p.status) === activeStatus);
    }
    return result;
  }, [pools, activeSector, activeStatus]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">All Pools</h1>
        <p className="text-muted-foreground mt-1">
          Browse open purchase pools and commit to meet supplier MOQs.
        </p>
      </div>

      {authenticated && <MintFaucet />}

      {countError && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-300">
          <p className="font-semibold">Failed to load pools</p>
          <p className="mt-1 text-red-400/80">
            {countError.message.includes("Missing")
              ? "Environment variables NEXT_PUBLIC_PURCHASE_POOL_ADDRESS and NEXT_PUBLIC_ALCHEMY_URL must be set."
              : `RPC error: ${countError.message}`}
          </p>
        </div>
      )}

      {!loading && pools.length > 0 && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Status
            </span>
            <button
              onClick={() => setActiveStatus(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                activeStatus === null
                  ? "gradient-brand text-white border-transparent shadow-md shadow-primary/20"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              All ({pools.length})
            </button>
            {POOL_UI_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() =>
                  setActiveStatus(activeStatus === status ? null : status)
                }
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                  activeStatus === status
                    ? "gradient-brand text-white border-transparent shadow-md shadow-primary/20"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${STATUS_COLORS[status]}`} />
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Sector filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Sector
            </span>
            <button
              onClick={() => setActiveSector(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                activeSector === null
                  ? "gradient-brand text-white border-transparent shadow-md shadow-primary/20"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
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
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                  activeSector === sector
                    ? "gradient-brand text-white border-transparent shadow-md shadow-primary/20"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {SECTOR_ICONS[sector]} {sector} ({sectorCounts[sector]})
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PoolCardSkeleton key={i} />
          ))}
        </div>
      ) : pools.length === 0 && !countError ? (
        <div className="rounded-xl border border-dashed border-primary/20 p-12 text-center">
          <p className="text-muted-foreground">
            No pools found. Deploy the contracts and seed pools to get started.
          </p>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-primary/20 p-12 text-center">
          <p className="text-muted-foreground">
            No pools match the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
