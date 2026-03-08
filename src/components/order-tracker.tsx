"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { getTieredPricing } from "@/lib/constants";
import type { PoolData } from "@/lib/hooks";

export interface FulfillmentStage {
  label: string;
  description: string;
  status: "completed" | "active" | "upcoming";
  estimatedDate?: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeStages(pool: PoolData): FulfillmentStage[] {
  const pricing = getTieredPricing(pool.productName);
  const deadlineMs = Number(pool.deadline) * 1000;
  const deadlineDate = new Date(deadlineMs);
  const shipDays = pricing?.shipmentDaysAfterClose ?? 10;
  const deliveryDays = shipDays + 3;

  const shippedDate = new Date(deadlineMs + shipDays * 86_400_000);
  const deliveredDate = new Date(deadlineMs + deliveryDays * 86_400_000);

  const moqMet = pool.totalUnits >= pool.moq;

  const stages: FulfillmentStage[] = [
    {
      label: "Commitments Open",
      description: "Pool is accepting buyer commitments toward the MOQ.",
      status: "upcoming",
    },
    {
      label: "MOQ Reached",
      description: moqMet
        ? "Minimum order met — fulfillment is locked in. Keep committing for better rates!"
        : "Minimum order quantity reached — the group order will be locked in.",
      status: "upcoming",
    },
    {
      label: "Deadline & Order Executed",
      description: "Pool closed at deadline — the group order has been finalized.",
      status: "upcoming",
    },
    {
      label: "Supplier Paid",
      description: "Funds withdrawn and sent to the supplier.",
      status: "upcoming",
    },
    {
      label: "Shipped to Your City",
      description: `Estimated arrival at local distribution.`,
      status: "upcoming",
      estimatedDate: formatDate(shippedDate),
    },
    {
      label: "Delivered to You",
      description: "Order delivered to your address.",
      status: "upcoming",
      estimatedDate: formatDate(deliveredDate),
    },
  ];

  const now = Date.now();

  switch (pool.status) {
    case 0: // Open — pool stays open until deadline
      stages[0].status = "active";
      if (moqMet) {
        stages[0].description = "Pool is open and accepting further commitments for better tier rates.";
        stages[1].status = "completed";
      }
      break;
    case 1: // Fulfilled — deadline passed, MOQ met
      stages[0].status = "completed";
      stages[1].status = "completed";
      stages[2].status = "active";
      break;
    case 3: // Withdrawn
      stages[0].status = "completed";
      stages[1].status = "completed";
      stages[2].status = "completed";
      stages[3].status = "completed";
      if (now >= shippedDate.getTime()) {
        stages[4].status = "completed";
        if (now >= deliveredDate.getTime()) {
          stages[5].status = "completed";
        } else {
          stages[5].status = "active";
        }
      } else {
        stages[4].status = "active";
      }
      break;
    case 2: // Expired
      stages[0].status = "completed";
      stages[0].description = "Pool expired — MOQ was not met before the deadline.";
      stages[1].description = "Minimum order was not reached.";
      stages.splice(2);
      break;
  }

  return stages;
}

const STATUS_STYLES = {
  completed: {
    dot: "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/30",
    line: "border-emerald-500/50",
    text: "text-foreground",
  },
  active: {
    dot: "gradient-brand animate-pulse shadow-md shadow-primary/30",
    line: "border-primary/30",
    text: "text-foreground",
  },
  upcoming: {
    dot: "bg-muted-foreground/20",
    line: "border-border",
    text: "text-muted-foreground",
  },
};

const CHECK_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="h-3 w-3 text-white"
  >
    <path
      fillRule="evenodd"
      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
      clipRule="evenodd"
    />
  </svg>
);

export function OrderTracker({ pool }: { pool: PoolData }) {
  const stages = useMemo(() => computeStages(pool), [pool]);

  if (pool.status === 2) return null;

  return (
    <div className="space-y-0">
      {stages.map((stage, i) => {
        const styles = STATUS_STYLES[stage.status];
        const isLast = i === stages.length - 1;

        return (
          <div key={stage.label} className="flex gap-3">
            {/* Vertical indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${styles.dot}`}
              >
                {stage.status === "completed" ? (
                  CHECK_ICON
                ) : stage.status === "active" ? (
                  <div className="h-2 w-2 rounded-full bg-white" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-px grow border-l-2 border-dashed ${styles.line} min-h-8`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${styles.text}`}>
                  {stage.label}
                </p>
                {stage.status === "active" && (
                  <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">
                    Current
                  </Badge>
                )}
                {stage.status === "completed" && (
                  <Badge className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0">
                    Done
                  </Badge>
                )}
              </div>
              <p className={`text-xs ${styles.text} opacity-70 mt-0.5`}>
                {stage.description}
              </p>
              {stage.estimatedDate && stage.status !== "completed" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Est. {stage.estimatedDate}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function isDelivered(pool: PoolData): boolean {
  if (pool.status !== 3) return false;
  const pricing = getTieredPricing(pool.productName);
  const shipDays = pricing?.shipmentDaysAfterClose ?? 10;
  const deliveryDays = shipDays + 3;
  const deliveredMs = Number(pool.deadline) * 1000 + deliveryDays * 86_400_000;
  return Date.now() >= deliveredMs;
}
