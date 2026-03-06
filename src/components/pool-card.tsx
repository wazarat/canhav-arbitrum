"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { POOL_STATUS_LABELS, POOL_STATUS_COLORS, formatUsdc } from "@/lib/constants";
import type { PoolData } from "@/lib/hooks";
import { Countdown } from "@/components/countdown";

export function PoolCard({ pool }: { pool: PoolData }) {
  const pct =
    pool.moq > 0n
      ? Number((pool.totalUnits * 100n) / pool.moq)
      : 0;

  return (
    <Link href={`/pools/${pool.id}`}>
      <Card className="transition-shadow hover:shadow-lg hover:border-primary/40 h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">
              {pool.productName}
            </CardTitle>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs ${POOL_STATUS_COLORS[pool.status] ?? ""}`}
            >
              {POOL_STATUS_LABELS[pool.status] ?? "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatUsdc(pool.pricePerUnit)} mUSDC / unit</span>
            <span>
              MOQ: {pool.moq.toString()} units
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>
                {pool.totalUnits.toString()} / {pool.moq.toString()} units
              </span>
              <span>{Math.min(pct, 100)}%</span>
            </div>
            <Progress value={Math.min(pct, 100)} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          <Countdown deadline={pool.deadline} />
        </CardFooter>
      </Card>
    </Link>
  );
}
