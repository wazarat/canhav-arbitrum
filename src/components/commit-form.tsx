"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseGwei } from "viem";
import { toast } from "sonner";
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

const GAS_OVERRIDES = {
  maxFeePerGas: parseGwei("0.1"),
  maxPriorityFeePerGas: parseGwei("0.001"),
} as const;

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

  const allowanceLoaded = allowance !== undefined;
  const needsApproval = cost > 0n && (!allowanceLoaded || cost > (allowance as bigint));

  const {
    writeContract: approve,
    isPending: isApproving,
    data: approveTx,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveTx,
      query: { enabled: !!approveTx },
    });

  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance();
      resetApprove();
    }
  }, [isApproveConfirmed, refetchAllowance, resetApprove]);

  const {
    writeContract: commit,
    isPending: isCommitting,
    data: commitTx,
  } = useWriteContract();

  const { isLoading: isCommitConfirming } = useWaitForTransactionReceipt({
    hash: commitTx,
    query: { enabled: !!commitTx },
  });

  function handleApprove() {
    approve(
      {
        ...mockUsdcConfig,
        functionName: "approve",
        args: [PURCHASE_POOL_ADDRESS, cost],
        ...GAS_OVERRIDES,
      },
      {
        onSuccess: () => {
          toast.success("Approval confirmed — click Commit to finalize");
        },
        onError: (err) => {
          toast.error(err.message.split("\n")[0] || "Approval failed");
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
        ...GAS_OVERRIDES,
      },
      {
        onSuccess: () => {
          toast.success(`Committed ${parsedUnits.toString()} units!`);
          setUnits("");
          onSuccess();
        },
        onError: (err) => {
          toast.error(err.message.split("\n")[0] || "Commit failed");
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
  const step = parsedUnits > 0n && needsApproval ? 1 : 2;

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

      {parsedUnits > 0n && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted-foreground/20 text-muted-foreground"
            }`}
          >
            1
          </span>
          <span className={step === 1 ? "text-foreground font-medium" : ""}>
            Approve
          </span>
          <span className="mx-1">&rarr;</span>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              step === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted-foreground/20 text-muted-foreground"
            }`}
          >
            2
          </span>
          <span className={step === 2 ? "text-foreground font-medium" : ""}>
            Commit
          </span>
        </div>
      )}

      {parsedUnits > 0n && needsApproval ? (
        <Button
          onClick={handleApprove}
          disabled={isWorking}
          className="w-full"
        >
          {isApproving
            ? "Waiting for wallet..."
            : isApproveConfirming
              ? "Confirming approval..."
              : `Approve ${formatUsdc(cost)} mUSDC`}
        </Button>
      ) : (
        <Button
          onClick={handleCommit}
          disabled={parsedUnits === 0n || isWorking || !allowanceLoaded}
          className="w-full"
        >
          {!allowanceLoaded && parsedUnits > 0n
            ? "Loading..."
            : isCommitting
              ? "Waiting for wallet..."
              : isCommitConfirming
                ? "Confirming commit..."
                : "Commit to Pool"}
        </Button>
      )}
    </div>
  );
}
