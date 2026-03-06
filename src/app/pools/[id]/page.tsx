"use client";

import { use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommitForm } from "@/components/commit-form";
import { MintFaucet } from "@/components/mint-faucet";
import { PoolProgress } from "@/components/pool-progress";
import { Countdown } from "@/components/countdown";
import { usePool, useCommitment } from "@/lib/hooks";
import {
  POOL_STATUS_LABELS,
  POOL_STATUS_COLORS,
  formatUsdc,
} from "@/lib/constants";

export default function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const poolId = Number(id);
  const { address } = useAccount();
  const { data: pool, isLoading, refetch } = usePool(poolId);
  const { data: commitment, refetch: refetchCommitment } = useCommitment(
    poolId,
    address,
  );

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
        <h1 className="text-3xl font-bold">{pool.productName}</h1>
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

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool ID</span>
                <span className="font-mono">{pool.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="font-mono text-xs">
                  {pool.token.slice(0, 6)}...{pool.token.slice(-4)}
                </span>
              </div>
              <Separator />
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

        {/* Right: commit form */}
        <div className="space-y-4">
          <MintFaucet />

          {pool.status === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Commit Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <CommitForm pool={pool} onSuccess={handleSuccess} />
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
