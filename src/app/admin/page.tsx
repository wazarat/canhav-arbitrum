"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  purchasePoolConfig,
  MOCK_USDC_ADDRESS,
} from "@/lib/contracts";
import { useOwner, usePoolCount, usePools, useFeeBps, useTotalFeesCollected } from "@/lib/hooks";
import {
  POOL_STATUS_LABELS,
  POOL_STATUS_COLORS,
  formatUsdc,
  parseUsdc,
} from "@/lib/constants";
import type { PoolData } from "@/lib/hooks";

function CreatePoolForm({ onSuccess }: { onSuccess: () => void }) {
  const [productName, setProductName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [moq, setMoq] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("14");

  const {
    writeContract,
    isPending,
    data: txHash,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  function handleCreate() {
    if (!productName || !pricePerUnit || !moq || !deadlineDays) {
      toast.error("All fields are required");
      return;
    }

    const price = parseUsdc(pricePerUnit);
    const moqVal = BigInt(moq);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400);

    const tierMinUnits = [1n, moqVal];
    const tierPrices = [price, price];
    const tierMandatory = [false, true];

    writeContract(
      {
        ...purchasePoolConfig,
        functionName: "createPool",
        args: [productName, tierMinUnits, tierPrices, tierMandatory, deadline, MOCK_USDC_ADDRESS],
      },
      {
        onSuccess: () => {
          toast.success(`Pool "${productName}" created!`);
          setProductName("");
          setPricePerUnit("");
          setMoq("");
          setDeadlineDays("14");
          onSuccess();
        },
        onError: (err) => {
          toast.error(err.message.split("\n")[0] || "Pool creation failed");
        },
      },
    );
  }

  const isWorking = isPending || isConfirming;

  return (
    <Card className="overflow-hidden border-primary/10">
      <div className="h-[2px] w-full bg-gradient-to-r from-primary via-violet-500 to-primary" />
      <CardHeader>
        <CardTitle>Create New Pool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            placeholder="e.g. Espresso Blend Coffee Beans"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="pricePerUnit">Price per Unit (mUSDC)</Label>
            <Input
              id="pricePerUnit"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 15"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moq">Minimum Order Qty</Label>
            <Input
              id="moq"
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={moq}
              onChange={(e) => setMoq(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (days from now)</Label>
            <Input
              id="deadline"
              type="number"
              min="1"
              placeholder="e.g. 14"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Token: mUSDC ({MOCK_USDC_ADDRESS.slice(0, 6)}...{MOCK_USDC_ADDRESS.slice(-4)})
        </div>

        <Button onClick={handleCreate} disabled={isWorking} className="w-full gradient-brand border-0 text-white hover:opacity-90 transition-opacity">
          {isWorking ? "Creating..." : "Create Pool"}
        </Button>
      </CardContent>
    </Card>
  );
}

function WithdrawRow({
  pool,
  onSuccess,
}: {
  pool: PoolData;
  onSuccess: () => void;
}) {
  const {
    writeContract,
    isPending,
    data: txHash,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  function handleWithdraw() {
    writeContract(
      {
        ...purchasePoolConfig,
        functionName: "withdrawFunds",
        args: [BigInt(pool.id)],
      },
      {
        onSuccess: () => {
          toast.success(`Withdrew ${formatUsdc(pool.totalDeposited)} mUSDC from pool #${pool.id}`);
          onSuccess();
        },
        onError: (err) => {
          toast.error(err.message.split("\n")[0] || "Withdrawal failed");
        },
      },
    );
  }

  const isWorking = isPending || isConfirming;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{pool.productName}</span>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${POOL_STATUS_COLORS[pool.status] ?? ""}`}
          >
            {POOL_STATUS_LABELS[pool.status] ?? "Unknown"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {pool.totalUnits.toString()}/{pool.moq.toString()} units
          &middot; {formatUsdc(pool.totalDeposited)} mUSDC deposited
        </p>
      </div>

      {pool.status === 1 && (
        <Button
          size="sm"
          onClick={handleWithdraw}
          disabled={isWorking}
        >
          {isWorking ? "Withdrawing..." : "Withdraw Funds"}
        </Button>
      )}

      {pool.status === 3 && (
        <Badge variant="outline" className="text-green-400 border-green-400/30">
          Withdrawn
        </Badge>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: owner } = useOwner();
  const { data: count } = usePoolCount();
  const poolCount = count ? Number(count) : 0;
  const { pools, isLoading, refetch } = usePools(poolCount);
  const { data: feeBps } = useFeeBps();
  const { data: totalFees } = useTotalFeesCollected();

  if (!isConnected) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Connect your wallet to access admin functions.
        </p>
      </div>
    );
  }

  const isOwner =
    owner && address && owner.toString().toLowerCase() === address.toLowerCase();

  if (!isOwner) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Your wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) is not the
          contract owner.
        </p>
        <p className="text-xs text-muted-foreground">
          Owner: {owner?.toString().slice(0, 6)}...{owner?.toString().slice(-4)}
        </p>
      </div>
    );
  }

  const fulfilledOrWithdrawn = pools.filter((p) => p.status === 1 || p.status === 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Create pools and withdraw funds from fulfilled pools.
        </p>
      </div>

      {/* Admin sub-navigation */}
      <div className="flex gap-2 border-b pb-3">
        <Button variant="secondary" size="sm">
          Pool Management
        </Button>
        <Link href="/admin/submissions">
          <Button variant="ghost" size="sm">
            Submissions
          </Button>
        </Link>
      </div>

      {/* Platform fee stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {feeBps !== undefined ? `${Number(feeBps) / 100}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Platform fee rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {totalFees !== undefined ? `${formatUsdc(totalFees as bigint)} mUSDC` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Total fees collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pools.length}</div>
            <p className="text-xs text-muted-foreground">Total pools</p>
          </CardContent>
        </Card>
      </div>

      <CreatePoolForm onSuccess={refetch} />

      <Separator />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pool Management</h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border bg-muted"
              />
            ))}
          </div>
        ) : pools.length === 0 ? (
          <p className="text-muted-foreground">No pools yet.</p>
        ) : (
          <div className="space-y-3">
            {pools.map((pool) => (
              <WithdrawRow key={pool.id} pool={pool} onSuccess={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
