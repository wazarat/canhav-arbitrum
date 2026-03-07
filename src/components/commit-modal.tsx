"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  purchasePoolConfig,
  mockUsdcConfig,
  PURCHASE_POOL_ADDRESS,
} from "@/lib/contracts";
import { useUsdcBalance, useUsdcAllowance } from "@/lib/hooks";
import type { PoolData } from "@/lib/hooks";
import {
  formatUsdc,
  getTieredPricing,
  getActiveTier,
  getDiscountPct,
  type TieredPricing,
  type PriceTier,
  USDC_DECIMALS,
} from "@/lib/constants";

function usdToUsdc(usd: number): bigint {
  return BigInt(Math.round(usd * 10 ** USDC_DECIMALS));
}

function extractRevertReason(err: Error): string {
  const msg = err.message || "Transaction failed";
  const revertMatch = msg.match(/reason:\s*(.+?)(?:\n|$)/);
  if (revertMatch) return revertMatch[1].trim();
  const shortMatch = msg.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/);
  if (shortMatch) return shortMatch[1].trim();
  return msg.split("\n")[0] || "Transaction failed";
}

function TierRow({
  tier,
  basePriceUsd,
  isActive,
}: {
  tier: PriceTier;
  basePriceUsd: number;
  isActive: boolean;
}) {
  const discount = getDiscountPct(basePriceUsd, tier.priceUsd);
  const rangeLabel =
    tier.maxUnits === null
      ? `${tier.minUnits}+ units`
      : `${tier.minUnits}–${tier.maxUnits} units`;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
        isActive
          ? "border-primary bg-primary/10"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{tier.label}</span>
          {isActive && (
            <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">
              Current
            </Badge>
          )}
          {!tier.mandatory && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
              Optional
            </Badge>
          )}
          {tier.mandatory && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-500/30">
              Locked In
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{rangeLabel}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold">${tier.priceUsd.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground">/unit</span>
        {discount > 0 && (
          <div className="text-xs font-medium text-green-400">
            Save {discount}%
          </div>
        )}
      </div>
    </div>
  );
}

function TieredCommitContent({
  pool,
  pricing,
  onSuccess,
}: {
  pool: PoolData;
  pricing: TieredPricing;
  onSuccess: () => void;
}) {
  const { address } = useAccount();
  const [units, setUnits] = useState("");
  const [open, setOpen] = useState(false);

  const parsedUnits = BigInt(Math.max(0, Math.floor(Number(units) || 0)));
  const currentTotalUnits = Number(pool.totalUnits);

  const projectedTotal = currentTotalUnits + Number(parsedUnits);
  const activeTier = getActiveTier(pricing, currentTotalUnits || 1);
  const projectedTier = parsedUnits > 0n
    ? getActiveTier(pricing, projectedTotal)
    : activeTier;

  const onChainCost = parsedUnits * pool.pricePerUnit;

  const { data: balance } = useUsdcBalance(address);
  const { data: allowance, refetch: refetchAllowance } = useUsdcAllowance(
    address,
    PURCHASE_POOL_ADDRESS,
  );

  const allowanceLoaded = allowance !== undefined;
  const needsApproval = onChainCost > 0n && (!allowanceLoaded || onChainCost > (allowance as bigint));

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
      refetchAllowance().then(() => {
        resetApprove();
      });
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

  const poolCloseDate = useMemo(() => {
    const now = new Date();
    const close = new Date(now.getTime() + pricing.poolDurationDays * 86400000);
    return close;
  }, [pricing.poolDurationDays]);

  const shipmentDate = useMemo(() => {
    return new Date(poolCloseDate.getTime() + pricing.shipmentDaysAfterClose * 86400000);
  }, [poolCloseDate, pricing.shipmentDaysAfterClose]);

  function handleApprove() {
    approve(
      {
        ...mockUsdcConfig,
        functionName: "approve",
        args: [PURCHASE_POOL_ADDRESS, onChainCost],
      },
      {
        onSuccess: () =>
          toast.success("Approval confirmed — click Commit to finalize"),
        onError: (err) =>
          toast.error(extractRevertReason(err)),
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
          toast.success(`Committed ${parsedUnits.toString()} units!`);
          setUnits("");
          setOpen(false);
          onSuccess();
        },
        onError: (err) =>
          toast.error(extractRevertReason(err)),
      },
    );
  }

  const isWorking =
    isApproving || isApproveConfirming || isCommitting || isCommitConfirming;
  const step = parsedUnits > 0n && needsApproval ? 1 : 2;

  const baseDiscount =
    parsedUnits > 0n
      ? getDiscountPct(pricing.basePriceUsd, projectedTier.priceUsd)
      : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="w-full" size="lg" />}
      >
        Commit to Pool
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commit to {pool.productName}</DialogTitle>
          <DialogDescription>
            Choose how many units to commit. Price drops as the pool grows.
          </DialogDescription>
        </DialogHeader>

        {/* Pricing Tiers */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Volume Pricing
          </h4>
          {pricing.tiers.map((tier) => (
            <TierRow
              key={tier.label}
              tier={tier}
              basePriceUsd={pricing.basePriceUsd}
              isActive={
                parsedUnits > 0n
                  ? projectedTier.label === tier.label
                  : activeTier.label === tier.label
              }
            />
          ))}
        </div>

        <Separator />

        {/* Timeline */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </h4>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Pool closes</p>
              <p className="text-xs text-muted-foreground">
                {poolCloseDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {" "}({pricing.poolDurationDays} days from now)
              </p>
            </div>
          </div>
          <div className="ml-4 h-4 border-l border-dashed border-muted-foreground/30" />
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Estimated shipment</p>
              <p className="text-xs text-muted-foreground">
                {shipmentDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {" "}({pricing.shipmentDaysAfterClose} days after close)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Commit form */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="commit-units">Units to commit</Label>
            <Input
              id="commit-units"
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            />
          </div>

          {parsedUnits > 0n && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your units</span>
                <span className="font-medium">{parsedUnits.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per unit</span>
                <span className="font-medium">
                  ${projectedTier.priceUsd.toFixed(2)}
                </span>
              </div>
              {baseDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your savings</span>
                  <span className="font-medium text-green-400">
                    {baseDiscount}% off base (${pricing.basePriceUsd.toFixed(2)})
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total cost</span>
                <span>{formatUsdc(onChainCost)} mUSDC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pool total after commit</span>
                <span>{projectedTotal} units &rarr; {projectedTier.label} tier</span>
              </div>
              {!projectedTier.mandatory && (
                <p className="text-xs text-amber-400/80 mt-1">
                  Below 80 units — pool fulfillment is optional. Pool may not execute.
                </p>
              )}
              {projectedTier.mandatory && (
                <p className="text-xs text-green-400/80 mt-1">
                  This tier locks in fulfillment — the pool will execute.
                </p>
              )}
            </div>
          )}

          {balance !== undefined && (
            <p className="text-xs text-muted-foreground">
              Wallet balance: {formatUsdc(balance as bigint)} mUSDC
            </p>
          )}

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
                  : `Approve ${formatUsdc(onChainCost)} mUSDC`}
            </Button>
          ) : (
            <Button
              onClick={handleCommit}
              disabled={parsedUnits === 0n || isWorking || !address || !allowanceLoaded}
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
      </DialogContent>
    </Dialog>
  );
}

export function CommitModal({
  pool,
  onSuccess,
}: {
  pool: PoolData;
  onSuccess: () => void;
}) {
  const pricing = getTieredPricing(pool.productName);

  if (pricing) {
    return (
      <TieredCommitContent
        pool={pool}
        pricing={pricing}
        onSuccess={onSuccess}
      />
    );
  }

  return <FallbackCommitModal pool={pool} onSuccess={onSuccess} />;
}

function FallbackCommitModal({
  pool,
  onSuccess,
}: {
  pool: PoolData;
  onSuccess: () => void;
}) {
  const { address } = useAccount();
  const [units, setUnits] = useState("");
  const [open, setOpen] = useState(false);

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
      refetchAllowance().then(() => {
        resetApprove();
      });
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
      },
      {
        onSuccess: () =>
          toast.success("Approval confirmed — click Commit to finalize"),
        onError: (err) =>
          toast.error(extractRevertReason(err)),
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
          toast.success(`Committed ${parsedUnits.toString()} units!`);
          setUnits("");
          setOpen(false);
          onSuccess();
        },
        onError: (err) =>
          toast.error(extractRevertReason(err)),
      },
    );
  }

  const isWorking =
    isApproving || isApproveConfirming || isCommitting || isCommitConfirming;
  const step = parsedUnits > 0n && needsApproval ? 1 : 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" size="lg" />}>
        Commit to Pool
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Commit to {pool.productName}</DialogTitle>
          <DialogDescription>
            Enter the number of units you want to commit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="commit-units-fb">Units to commit</Label>
            <Input
              id="commit-units-fb"
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            />
          </div>

          {parsedUnits > 0n && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per unit</span>
                <span>{formatUsdc(pool.pricePerUnit)} mUSDC</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total cost</span>
                <span>{formatUsdc(cost)} mUSDC</span>
              </div>
            </div>
          )}

          {balance !== undefined && (
            <p className="text-xs text-muted-foreground">
              Wallet balance: {formatUsdc(balance as bigint)} mUSDC
            </p>
          )}

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
              disabled={parsedUnits === 0n || isWorking || !address || !allowanceLoaded}
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
      </DialogContent>
    </Dialog>
  );
}
