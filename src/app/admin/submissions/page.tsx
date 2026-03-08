"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOwner } from "@/lib/hooks";
import { fetchSubmissions, type SubmissionRecord } from "../actions";

interface ProductGroup {
  product: string;
  entries: SubmissionRecord[];
  totalUnits: number;
  frequencyBreakdown: Record<string, number>;
  latestAt: string;
}

function groupByProduct(items: SubmissionRecord[], productKey: "productName" | "product"): ProductGroup[] {
  const map = new Map<string, SubmissionRecord[]>();

  for (const item of items) {
    const name = String(item[productKey] ?? "Unknown");
    const list = map.get(name) ?? [];
    list.push(item);
    map.set(name, list);
  }

  const groups: ProductGroup[] = [];
  for (const [product, entries] of map) {
    let totalUnits = 0;
    const frequencyBreakdown: Record<string, number> = {};
    let latestAt = "";

    for (const e of entries) {
      const u = parseInt(String(e.units ?? "0"), 10);
      if (!isNaN(u)) totalUnits += u;

      const freq = String(e.frequency ?? e.quantity ?? "-");
      frequencyBreakdown[freq] = (frequencyBreakdown[freq] ?? 0) + 1;

      if (e.submittedAt && e.submittedAt > latestAt) latestAt = e.submittedAt;
    }

    groups.push({ product, entries, totalUnits, frequencyBreakdown, latestAt });
  }

  groups.sort((a, b) => b.entries.length - a.entries.length);
  return groups;
}

function InterestEntry({ item }: { item: SubmissionRecord }) {
  return (
    <div className="rounded-lg border p-3 text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{String(item.name ?? "-")}</span>
        <span className="text-xs text-muted-foreground">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
        <span>Email: {String(item.email ?? "-")}</span>
        <span>Units: {String(item.units ?? "-")}</span>
        <span>Frequency: {String(item.frequency ?? "-")}</span>
        {item.comments ? (
          <span className="col-span-2">Comments: {String(item.comments)}</span>
        ) : null}
      </div>
    </div>
  );
}

function RequestEntry({ item }: { item: SubmissionRecord }) {
  return (
    <div className="rounded-lg border p-3 text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{String(item.product ?? "-")}</span>
        <span className="text-xs text-muted-foreground">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
        <span>Quantity: {String(item.quantity ?? "-")}</span>
        <span>Price range: {String(item.priceRange ?? "-")}</span>
        <span className="col-span-2">Contact: {String(item.contact ?? "-")}</span>
        {item.notes ? (
          <span className="col-span-2">Notes: {String(item.notes)}</span>
        ) : null}
      </div>
    </div>
  );
}

function ProductGroupCard({
  group,
  type,
}: {
  group: ProductGroup;
  type: "interests" | "requests";
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">{group.product}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {group.entries.length} {group.entries.length === 1 ? "submission" : "submissions"}
              </Badge>
            </div>
            <span className="text-muted-foreground text-lg">
              {expanded ? "−" : "+"}
            </span>
          </div>
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            {type === "interests" && group.totalUnits > 0 && (
              <span>{group.totalUnits} total units requested</span>
            )}
            {Object.entries(group.frequencyBreakdown).map(([freq, count]) => (
              <span key={freq}>
                {freq}: {count}
              </span>
            ))}
            {group.latestAt && (
              <span>Latest: {new Date(group.latestAt).toLocaleDateString()}</span>
            )}
          </div>
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 pt-0">
          <Separator className="mb-3" />
          {group.entries.map((item, i) =>
            type === "interests" ? (
              <InterestEntry key={i} item={item} />
            ) : (
              <RequestEntry key={i} item={item} />
            ),
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function SubmissionsPage() {
  const { address, isConnected } = useAccount();
  const { data: owner } = useOwner();

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

  if (!isConnected) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Submissions</h1>
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
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-muted-foreground">
          Your wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) is not
          authorized to view this page.
        </p>
      </div>
    );
  }

  const interestGroups = groupByProduct(interests, "productName");
  const requestGroups = groupByProduct(requests, "product");
  const groups = tab === "interests" ? interestGroups : requestGroups;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submissions</h1>
          <p className="text-muted-foreground">
            User interest registrations and pool requests, grouped by product.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          Refresh
        </Button>
      </div>

      {/* Admin sub-navigation */}
      <div className="flex gap-2 border-b pb-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            Pool Management
          </Button>
        </Link>
        <Button variant="secondary" size="sm">
          Submissions
        </Button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{interests.length + requests.length}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{interestGroups.length}</div>
            <p className="text-xs text-muted-foreground">Products with interest</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{requestGroups.length}</div>
            <p className="text-xs text-muted-foreground">New pool requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Grouped submissions */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No {tab === "interests" ? "interest registrations" : "pool requests"} yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <ProductGroupCard key={group.product} group={group} type={tab} />
          ))}
        </div>
      )}
    </div>
  );
}
