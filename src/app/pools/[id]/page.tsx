"use client";

import { use } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommitModal } from "@/components/commit-modal";
import { MintFaucet } from "@/components/mint-faucet";
import { PoolProgress } from "@/components/pool-progress";
import { Countdown } from "@/components/countdown";
import { usePool, useCommitment, useBuyerCount } from "@/lib/hooks";
import {
  POOL_STATUS_LABELS,
  POOL_STATUS_COLORS,
  SECTOR_ICONS,
  formatUsdc,
  getSector,
  getTieredPricing,
  getActiveTier,
  getDiscountPct,
} from "@/lib/constants";

export default function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const poolId = Number(id);
  const { authenticated } = usePrivy();
  const { address } = useAccount();
  const { data: pool, isLoading, refetch } = usePool(poolId);
  const { data: commitment, refetch: refetchCommitment } = useCommitment(
    poolId,
    address,
  );
  const { data: buyerCount } = useBuyerCount(poolId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Pool not found</h1>
        <Link
          href="/pools"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to pools
        </Link>
      </div>
    );
  }

  const handleSuccess = () => {
    refetch();
    refetchCommitment();
  };

  const pricing = getTieredPricing(pool.productName);
  const currentTotal = Number(pool.totalUnits);
  const activeTier = pricing ? getActiveTier(pricing, currentTotal || 1) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/pools"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to pools
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{pool.productName}</h1>
          {(() => {
            const sector = getSector(pool.productName);
            return sector ? (
              <span className="text-sm text-muted-foreground">
                {SECTOR_ICONS[sector]} {sector}
              </span>
            ) : null;
          })()}
        </div>
        <Badge
          variant="outline"
          className={`text-sm ${POOL_STATUS_COLORS[pool.status] ?? ""}`}
        >
          {POOL_STATUS_LABELS[pool.status] ?? "Unknown"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: progress & info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pool Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <PoolProgress pool={pool} />
            </CardContent>
          </Card>

          {/* Tiered pricing visualization */}
          {pricing && activeTier && (
            <Card>
              <CardHeader>
                <CardTitle>Volume Pricing Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pricing.tiers.map((tier) => {
                  const isActive = activeTier.label === tier.label;
                  const discount = getDiscountPct(pricing.basePriceUsd, tier.priceUsd);
                  const rangeLabel =
                    tier.maxUnits === null
                      ? `${tier.minUnits}+ units`
                      : `${tier.minUnits}–${tier.maxUnits} units`;

                  return (
                    <div
                      key={tier.label}
                      className={`relative flex items-center justify-between rounded-lg border p-4 transition-colors ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{tier.label}</span>
                          {isActive && (
                            <Badge className="bg-primary/20 text-primary text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rangeLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tier.mandatory
                            ? "Fulfillment locked in once this tier is reached"
                            : "Optional — pool may not execute at this level"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xl font-bold">
                          ${tier.priceUsd.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">per unit</p>
                        {discount > 0 && (
                          <p className="text-sm font-medium text-green-400">
                            Save {discount}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <Countdown deadline={pool.deadline} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Total value at MOQ
                </span>
                <span>
                  {formatUsdc(pool.pricePerUnit * pool.moq)} mUSDC
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buyers</span>
                <span>{buyerCount !== undefined ? buyerCount.toString() : "—"}</span>
              </div>
              {pricing && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current tier</span>
                    <span className="font-medium">
                      {activeTier?.label} (${activeTier?.priceUsd.toFixed(2)}/unit)
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* User's commitment */}
          {commitment && commitment.units > 0n && (
            <Card>
              <CardHeader>
                <CardTitle>Your Commitment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Units</span>
                  <span>{commitment.units.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposited</span>
                  <span>{formatUsdc(commitment.deposited)} mUSDC</span>
                </div>
                {commitment.refunded && (
                  <Badge variant="outline" className="text-green-400">
                    Refunded
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: commit action */}
        <div className="space-y-4">
          {authenticated && <MintFaucet />}

          {authenticated && pool.status === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Join This Pool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pricing && activeTier && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current price</span>
                      <span className="font-semibold">${activeTier.priceUsd.toFixed(2)}/unit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool units</span>
                      <span>{currentTotal} committed</span>
                    </div>
                    {!activeTier.mandatory && (
                      <p className="text-xs text-amber-400/80 mt-1">
                        Pool needs {80 - currentTotal > 0 ? 80 - currentTotal : 0} more units to lock in fulfillment.
                      </p>
                    )}
                  </div>
                )}
                <CommitModal pool={pool} onSuccess={handleSuccess} />
              </CardContent>
            </Card>
          )}

          {!authenticated && pool.status === 0 && (
            <Card>
              <CardContent className="py-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Sign in to commit funds to this pool.
                </p>
              </CardContent>
            </Card>
          )}

          {pool.status === 1 && (
            <Card>
              <CardContent className="py-6 text-center space-y-2">
                <p className="text-lg font-semibold text-blue-400">
                  MOQ Reached!
                </p>
                <p className="text-sm text-muted-foreground">
                  This pool has been fulfilled. The admin will withdraw funds to
                  pay the supplier.
                </p>
              </CardContent>
            </Card>
          )}

          {pool.status === 2 && (
            <Card>
              <CardContent className="py-6 text-center space-y-2">
                <p className="text-lg font-semibold text-red-400">
                  Pool Expired
                </p>
                <p className="text-sm text-muted-foreground">
                  The MOQ was not met before the deadline. You can claim a
                  refund from the My Commitments page.
                </p>
                <Link
                  href="/my-commitments"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  Go to My Commitments
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
