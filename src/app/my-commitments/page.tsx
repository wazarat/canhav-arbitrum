"use client";

import Link from "next/link";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePoolCount, usePools, useCommitment } from "@/lib/hooks";
import {
  POOL_STATUS_LABELS,
  POOL_STATUS_COLORS,
  formatUsdc,
} from "@/lib/constants";
import { purchasePoolConfig } from "@/lib/contracts";
import type { PoolData } from "@/lib/hooks";

function CommitmentRow({
  pool,
  onRefundSuccess,
}: {
  pool: PoolData;
  onRefundSuccess: () => void;
}) {
  const { address } = useAccount();
  const { data: commitment, refetch } = useCommitment(pool.id, address);

  const {
    writeContract: claimRefund,
    isPending,
    data: refundTx,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: refundTx,
    query: { enabled: !!refundTx },
  });

  if (!commitment || commitment.units === 0n) return null;

  const canRefund =
    pool.status === 2 && !commitment.refunded && commitment.deposited > 0n;

  function handleRefund() {
    claimRefund(
      {
        ...purchasePoolConfig,
        functionName: "claimRefund",
        args: [BigInt(pool.id)],
      },
      {
        onSuccess: () => {
          refetch();
          onRefundSuccess();
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/pools/${pool.id}`}
            className="hover:underline"
          >
            <CardTitle className="text-base">{pool.productName}</CardTitle>
          </Link>
          <Badge
            variant="outline"
            className={`text-xs ${POOL_STATUS_COLORS[pool.status] ?? ""}`}
          >
            {POOL_STATUS_LABELS[pool.status] ?? "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Units</span>
            <p className="font-medium">{commitment.units.toString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Deposited</span>
            <p className="font-medium">
              {formatUsdc(commitment.deposited)} mUSDC
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium">
              {commitment.refunded ? "Refunded" : "Active"}
            </p>
          </div>
        </div>

        {canRefund && (
          <Button
            onClick={handleRefund}
            disabled={isPending || isConfirming}
            variant="destructive"
            size="sm"
          >
            {isPending || isConfirming ? "Claiming..." : "Claim Refund"}
          </Button>
        )}

        {commitment.refunded && (
          <Badge variant="outline" className="text-green-400 border-green-400/30">
            Refund claimed
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyCommitmentsPage() {
  const { address, isConnected } = useAccount();
  const { data: count } = usePoolCount();
  const poolCount = count ? Number(count) : 0;
  const { pools, isLoading, refetch } = usePools(poolCount);

  if (!isConnected) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">My Commitments</h1>
        <p className="text-muted-foreground">
          Connect your wallet to view your commitments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Commitments</h1>
        <p className="text-muted-foreground">
          View your active commitments and claim refunds for expired pools.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : pools.length === 0 ? (
        <p className="text-muted-foreground">No pools found on-chain yet.</p>
      ) : (
        <div className="space-y-4">
          {pools.map((pool) => (
            <CommitmentRow
              key={pool.id}
              pool={pool}
              onRefundSuccess={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
