"use client";

import { useState, useEffect, useCallback } from "react";
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
import { fetchSubmissions, type SubmissionRecord } from "./actions";
import {
  purchasePoolConfig,
  MOCK_USDC_ADDRESS,
} from "@/lib/contracts";
import { useOwner, usePoolCount, usePools } from "@/lib/hooks";
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

    writeContract(
      {
        ...purchasePoolConfig,
        functionName: "createPool",
        args: [productName, price, moqVal, deadline, MOCK_USDC_ADDRESS],
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
    <Card>
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

        <Button onClick={handleCreate} disabled={isWorking} className="w-full">
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

function SubmissionsPanel() {
  const [interests, setInterests] = useState<SubmissionRecord[]>([]);
  const [requests, setRequests] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"interests" | "requests">("interests");

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await fetchSubmissions();
    if (result.error) {
      toast.error(result.error);
    } else {
      setInterests(result.interests);
      setRequests(result.requests);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const items = tab === "interests" ? interests : requests;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Submissions</CardTitle>
          <Button variant="outline" size="sm" onClick={loadData}>
            Refresh
          </Button>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setTab("interests")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "interests"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Register Interest ({interests.length})
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "requests"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Pool Requests ({requests.length})
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No {tab === "interests" ? "interest registrations" : "pool requests"} yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {String(item.productName ?? item.product ?? "—")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ""}
                  </span>
                </div>
                {tab === "interests" ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                    <span>Name: {String(item.name ?? "—")}</span>
                    <span>Email: {String(item.email ?? "—")}</span>
                    <span>Units: {String(item.units ?? "—")}</span>
                    <span>Frequency: {String(item.frequency ?? "—")}</span>
                    {item.comments ? (
                      <span className="col-span-2">Comments: {String(item.comments)}</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                    <span>Quantity: {String(item.quantity ?? "—")}</span>
                    <span>Price range: {String(item.priceRange ?? "—")}</span>
                    <span className="col-span-2">Contact: {String(item.contact ?? "—")}</span>
                    {item.notes ? (
                      <span className="col-span-2">Notes: {String(item.notes)}</span>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: owner } = useOwner();
  const { data: count } = usePoolCount();
  const poolCount = count ? Number(count) : 0;
  const { pools, isLoading, refetch } = usePools(poolCount);

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

      <Separator />

      <SubmissionsPanel />
    </div>
  );
}
