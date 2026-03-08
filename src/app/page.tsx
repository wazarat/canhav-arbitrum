"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { PoolCard } from "@/components/pool-card";
import { PoolCardSkeleton } from "@/components/pool-card-skeleton";
import { usePublicPoolCount, usePublicPools } from "@/lib/pool-reader";
import { cn } from "@/lib/utils";
import { Shield, Coins, RefreshCw, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data: poolCount = 0, isLoading: countLoading } =
    usePublicPoolCount();
  const { data: pools = [], isLoading: poolsLoading } =
    usePublicPools(poolCount);

  const loading = countLoading || poolsLoading;
  const activePools = pools.filter((p) => p.status === 0);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-8 pt-16 pb-4 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="relative">
          <Image
            src="/canhav-logo.svg"
            alt="CanHav Group Pool"
            width={400}
            height={100}
            priority
            className="h-20 w-auto sm:h-28"
          />
        </div>

        <p className="relative max-w-2xl text-lg sm:text-xl leading-relaxed text-muted-foreground">
          Small businesses pool funds together to meet supplier minimum order
          quantities. Commit stablecoins to a pool. When the MOQ is hit,
          the order executes. If it isn&apos;t met by the deadline, get a full refund.
        </p>

        <div className="relative flex gap-3">
          <Link
            href="/pools"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gradient-brand border-0 text-white hover:opacity-90 transition-opacity px-8"
            )}
          >
            Browse Pools
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/my-commitments"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-primary/30 hover:border-primary/50 hover:bg-primary/5 px-8"
            )}
          >
            My Commitments
          </Link>
        </div>

        <div className="relative flex items-center gap-4 mt-2">
          {[
            { icon: Shield, label: "Arbitrum Sepolia" },
            { icon: Coins, label: "ERC-20 Escrow" },
            { icon: RefreshCw, label: "Trustless MOQ" },
          ].map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-muted-foreground"
            >
              <item.icon className="h-3 w-3 text-primary" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* Active pools preview */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Active Pools</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Join an open pool to lock in wholesale pricing
            </p>
          </div>
          <Link
            href="/pools"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-primary hover:text-primary/80"
            )}
          >
            View all &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PoolCardSkeleton key={i} />
            ))}
          </div>
        ) : activePools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary/20 p-12 text-center">
            <p className="text-muted-foreground">
              No active pools right now. Check back soon or deploy the contracts and
              seed pools.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activePools.slice(0, 6).map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">How It Works</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Three simple steps to unlock bulk pricing
          </p>
        </div>
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
              className="group relative rounded-xl border border-primary/10 bg-card/50 p-8 text-center space-y-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-brand text-white font-bold text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
