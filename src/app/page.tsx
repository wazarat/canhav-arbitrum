"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { PoolCard } from "@/components/pool-card";
import { PoolCardSkeleton } from "@/components/pool-card-skeleton";
import { usePoolCount, usePools } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { data: count } = usePoolCount();
  const poolCount = count ? Number(count) : 0;
  const { pools, isLoading } = usePools(poolCount);

  const activePools = pools.filter((p) => p.status === 0);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 pt-12 text-center">
        <Image
          src="/canhav-logo.svg"
          alt="CanHav Group Pool"
          width={400}
          height={100}
          priority
          className="h-20 w-auto sm:h-24"
        />
        <p className="max-w-xl text-lg text-muted-foreground">
          Small businesses pool funds together to meet supplier minimum order
          quantities. Commit stablecoins to a pool &mdash; when the MOQ is hit,
          the order executes. If it isn&apos;t met by the deadline, get a full refund.
        </p>
        <div className="flex gap-3">
          <Link href="/pools" className={cn(buttonVariants({ size: "lg" }))}>
            Browse Pools
          </Link>
          <Link
            href="/my-commitments"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            My Commitments
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <span>Arbitrum Sepolia</span>
          <span>&middot;</span>
          <span>ERC-20 Escrow</span>
          <span>&middot;</span>
          <span>Trustless MOQ</span>
        </div>
      </section>

      {/* Active pools preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Active Pools</h2>
          <Link
            href="/pools"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PoolCardSkeleton key={i} />
            ))}
          </div>
        ) : activePools.length === 0 ? (
          <p className="text-muted-foreground">
            No active pools right now. Check back soon or deploy the contracts and
            seed pools.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePools.slice(0, 6).map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Browse & Choose",
              desc: "Find a product pool that your business needs. See the current progress toward the supplier MOQ.",
            },
            {
              step: "2",
              title: "Commit Funds",
              desc: "Approve and deposit mUSDC for your desired quantity. Your tokens are held in escrow on-chain.",
            },
            {
              step: "3",
              title: "Order or Refund",
              desc: "When the pool hits the MOQ, the order is locked in. If the deadline passes unfulfilled, claim a full refund.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-lg border p-6 text-center space-y-2"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                {item.step}
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
