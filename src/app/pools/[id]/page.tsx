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
import { RegisterInterestDialog } from "@/components/register-interest-dialog";
import { PoolProgress } from "@/components/pool-progress";
import { Countdown } from "@/components/countdown";
import { StarRating } from "@/components/star-rating";
import { OrderTracker, isDelivered } from "@/components/order-tracker";
import { RatingDialog } from "@/components/rating-dialog";
import {
  usePool,
  useCommitment,
  useBuyerCount,
  usePoolTiers,
  getOnChainActiveTierPrice,
} from "@/lib/hooks";
import {
  POOL_STATUS_LABELS,
  POOL_STATUS_COLORS,
  SECTOR_ICONS,
  formatUsdc,
  getSector,
  getTieredPricing,
  getActiveTier,
  getDiscountPct,
  getPoolUIStatus,
  getClosedPoolMeta,
  getSupplierInfo,
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
  const { data: onChainTiers } = usePoolTiers(poolId);

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

  const uiStatus = getPoolUIStatus(poolId, pool.status);
  const closedMeta = getClosedPoolMeta(poolId);

  if (uiStatus === "Evaluating") {
    return (
      <div className="py-20 text-center space-y-6">
        <h1 className="text-3xl font-bold">{pool.productName}</h1>
        <Badge
          variant="outline"
          className="text-sm bg-amber-500/15 text-amber-400 border-amber-500/25"
        >
          Evaluating
        </Badge>
        <p className="text-muted-foreground max-w-md mx-auto">
          This pool is being evaluated. Register your interest and
          we&apos;ll notify you when it launches.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/pools"
            className={cn(buttonVariants({ variant: "outline" }), "border-primary/30")}
          >
            &larr; Back to pools
          </Link>
          <RegisterInterestDialog
            productName={pool.productName}
            buttonVariant="default"
            buttonSize="default"
            buttonClassName=""
          />
        </div>
      </div>
    );
  }

  if (uiStatus === "Closed" && closedMeta) {
    const sector = getSector(pool.productName);
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
            {sector && (
              <span className="text-sm text-muted-foreground">
                {SECTOR_ICONS[sector]} {sector}
              </span>
            )}
          </div>
          <Badge
            variant="outline"
            className="text-sm bg-gray-500/20 text-gray-400 border-gray-500/30"
          >
            Closed
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Rating */}
            <Card>
              <CardHeader>
                <CardTitle>Pool Rating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StarRating rating={closedMeta.rating} size="lg" />
                <p className="text-sm text-muted-foreground">
                  Based on feedback from {closedMeta.totalBuyers} participants
                </p>
              </CardContent>
            </Card>

            {/* Sourcing */}
            <Card>
              <CardHeader>
                <CardTitle>Sourcing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier / Source</span>
                  <span className="font-medium text-right">{closedMeta.source}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region</span>
                  <span>{closedMeta.region}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per unit</span>
                  <span>{formatUsdc(pool.pricePerUnit)} mUSDC</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MOQ</span>
                  <span>{pool.moq.toString()} units</span>
                </div>
              </CardContent>
            </Card>

            {/* Pool History */}
            <Card>
              <CardHeader>
                <CardTitle>Pool History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total buyers</span>
                  <span>{closedMeta.totalBuyers}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Units committed</span>
                  <span>{closedMeta.totalUnitsCommitted}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closed date</span>
                  <span>{closedMeta.closedDate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Closure Reason */}
            <Card>
              <CardHeader>
                <CardTitle>Closure Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{closedMeta.closureReason}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interested in this product?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This pool has closed, but you can register interest to
                  help us re-open it with a new batch.
                </p>
                <RegisterInterestDialog
                  productName={pool.productName}
                  buttonVariant="default"
                  buttonSize="default"
                  buttonClassName="w-full"
                  buttonLabel="Register Interest"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    refetch();
    refetchCommitment();
  };

  const pricing = getTieredPricing(pool.productName);
  const supplier = getSupplierInfo(pool.productName);
  const currentTotal = Number(pool.totalUnits);
  const activeTier = pricing ? getActiveTier(pricing, currentTotal || 1) : null;

  const currentTierPrice = onChainTiers
    ? getOnChainActiveTierPrice(onChainTiers, pool.totalUnits > 0n ? pool.totalUnits : 1n)
    : pool.pricePerUnit;

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

          {/* Order Fulfillment Tracker */}
          {(pool.status !== 2) && (
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTracker pool={pool} />
              </CardContent>
            </Card>
          )}

          {/* Supplier information */}
          {supplier && (
            <Card>
              <CardHeader>
                <CardTitle>Supplier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">{supplier.region}</p>
                  </div>
                  <StarRating rating={supplier.rating} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {supplier.description}
                </p>
                {supplier.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {supplier.certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tiered pricing visualization - on-chain data preferred */}
          {onChainTiers && onChainTiers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Volume Pricing Tiers (On-Chain)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {onChainTiers.map((tier, idx) => {
                  const TIER_LABELS = ["Starter", "Bulk", "Wholesale", "Tier 4", "Tier 5"];
                  const label = pricing?.tiers[idx]?.label ?? TIER_LABELS[idx] ?? `Tier ${idx + 1}`;
                  const isActive = currentTierPrice === tier.pricePerUnit;
                  const basePrice = onChainTiers[0].pricePerUnit;
                  const discount = basePrice > 0n
                    ? Number(((basePrice - tier.pricePerUnit) * 10000n) / basePrice) / 100
                    : 0;
                  const nextMin = idx < onChainTiers.length - 1 ? onChainTiers[idx + 1].minUnits - 1n : null;
                  const rangeLabel = nextMin === null
                    ? `${tier.minUnits}+ units`
                    : `${tier.minUnits}–${nextMin} units`;

                  return (
                    <div
                      key={idx}
                      className={`relative flex items-center justify-between rounded-xl border p-4 transition-all duration-200 ${
                        isActive
                          ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
                          : "border-border hover:border-primary/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{label}</span>
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
                            : "Optional. Pool may not execute at this level"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xl font-bold">
                          {formatUsdc(tier.pricePerUnit)} mUSDC
                        </p>
                        <p className="text-xs text-muted-foreground">per unit</p>
                        {discount > 0 && (
                          <p className="text-sm font-medium text-green-400">
                            Save {discount.toFixed(1)}%
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
                  {formatUsdc(currentTierPrice * pool.moq)} mUSDC
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buyers</span>
                <span>{buyerCount !== undefined ? buyerCount.toString() : "-"}</span>
              </div>
              {onChainTiers && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current price/unit</span>
                    <span className="font-medium">
                      {formatUsdc(currentTierPrice)} mUSDC
                      {activeTier ? ` (${activeTier.label})` : ""}
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
            <Card className="overflow-hidden border-primary/20">
              <div className="h-[2px] w-full bg-gradient-to-r from-primary via-violet-500 to-primary" />
              <CardHeader>
                <CardTitle>Join This Pool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {onChainTiers && (
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current price</span>
                      <span className="font-semibold text-primary">{formatUsdc(currentTierPrice)} mUSDC/unit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool units</span>
                      <span>{currentTotal} committed</span>
                    </div>
                    {(() => {
                      const threshold = Number(pool.moq);
                      const remaining = threshold - currentTotal;
                      if (remaining <= 0) {
                        const nextTier = onChainTiers.find(
                          (t) => t.minUnits > pool.totalUnits && t.pricePerUnit < currentTierPrice
                        );
                        return (
                          <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 space-y-1">
                            <p className="text-xs font-semibold text-emerald-400">
                              MOQ reached! Fulfillment locked in.
                            </p>
                            {nextTier ? (
                              <p className="text-xs text-emerald-400/80">
                                Keep committing to reach {nextTier.minUnits.toString()} units for an even better rate of {formatUsdc(nextTier.pricePerUnit)} mUSDC/unit.
                              </p>
                            ) : (
                              <p className="text-xs text-emerald-400/80">
                                Pool stays open until the deadline. Commit more to increase your order.
                              </p>
                            )}
                          </div>
                        );
                      }
                      return (
                        <p className="text-xs text-amber-400/80 mt-1">
                          Pool needs {remaining} more units to lock in fulfillment.
                        </p>
                      );
                    })()}
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
                <p className="text-lg font-semibold text-emerald-400">
                  Pool Fulfilled
                </p>
                <p className="text-sm text-muted-foreground">
                  The deadline has passed and the MOQ was met. The group order
                  is locked in and the admin will withdraw funds to pay the supplier.
                </p>
              </CardContent>
            </Card>
          )}

          {pool.status === 3 && (
            <Card>
              <CardContent className="py-6 text-center space-y-2">
                <p className="text-lg font-semibold text-green-400">
                  Supplier Paid
                </p>
                <p className="text-sm text-muted-foreground">
                  Funds have been sent to the supplier. Your order is on its way!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Rating section - visible after delivery */}
          {isDelivered(pool) && commitment && commitment.units > 0n && (
            <Card>
              <CardHeader>
                <CardTitle>Rate This Order</CardTitle>
              </CardHeader>
              <CardContent>
                <RatingDialog poolId={pool.id} productName={pool.productName} />
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
