"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  purchasePoolConfig,
  mockUsdcConfig,
  PURCHASE_POOL_ADDRESS,
} from "@/lib/contracts";
import { useUsdcBalance, useUsdcAllowance } from "@/lib/hooks";
import { formatUsdc } from "@/lib/constants";
import type { PoolData } from "@/lib/hooks";

export function CommitForm({
  pool,
  onSuccess,
}: {
  pool: PoolData;
  onSuccess: () => void;
}) {
  const { address } = useAccount();
  const [units, setUnits] = useState("");

  const parsedUnits = BigInt(Math.max(0, Math.floor(Number(units) || 0)));
  const cost = parsedUnits * pool.pricePerUnit;

  const { data: balance } = useUsdcBalance(address);
  const { data: allowance, refetch: refetchAllowance } = useUsdcAllowance(
    address,
    PURCHASE_POOL_ADDRESS,
  );

  const needsApproval = allowance !== undefined && cost > (allowance as bigint);

  const {
    writeContract: approve,
    isPending: isApproving,
    data: approveTx,
  } = useWriteContract();

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveTx,
    query: {
      enabled: !!approveTx,
    },
  });

  const {
    writeContract: commit,
    isPending: isCommitting,
    data: commitTx,
  } = useWriteContract();

  const { isLoading: isCommitConfirming } = useWaitForTransactionReceipt({
    hash: commitTx,
    query: {
      enabled: !!commitTx,
    },
  });

  function handleApprove() {
    approve(
      {
        ...mockUsdcConfig,
        functionName: "approve",
        args: [PURCHASE_POOL_ADDRESS, cost],
      },
      {
        onSuccess: () => {
          refetchAllowance();
        },
      },
    );
  }

  function handleCommit() {
    commit(
      {
        ...purchasePoolConfig,
        functionName: "commit",
        args: [BigInt(pool.id), parsedUnits],
      },
      {
        onSuccess: () => {
          setUnits("");
          onSuccess();
        },
      },
    );
  }

  if (!address) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect your wallet to commit to this pool.
      </p>
    );
  }

  const isWorking =
    isApproving || isApproveConfirming || isCommitting || isCommitConfirming;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="units">Units to commit</Label>
        <Input
          id="units"
          type="number"
          min="1"
          placeholder="e.g. 10"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />
        {parsedUnits > 0n && (
          <p className="text-sm text-muted-foreground">
            Cost: {formatUsdc(cost)} mUSDC
          </p>
        )}
        {balance !== undefined && (
          <p className="text-xs text-muted-foreground">
            Balance: {formatUsdc(balance as bigint)} mUSDC
          </p>
        )}
      </div>

      {parsedUnits > 0n && needsApproval ? (
        <Button
          onClick={handleApprove}
          disabled={isWorking}
          className="w-full"
        >
          {isApproving || isApproveConfirming
            ? "Approving..."
            : `Approve ${formatUsdc(cost)} mUSDC`}
        </Button>
      ) : (
        <Button
          onClick={handleCommit}
          disabled={parsedUnits === 0n || isWorking}
          className="w-full"
        >
          {isCommitting || isCommitConfirming
            ? "Committing..."
            : "Commit to Pool"}
        </Button>
      )}
    </div>
  );
}
