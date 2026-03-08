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
import {
  SECTOR_ICONS,
  formatUsdc,
  getSector,
  getPoolUIStatus,
  getClosedPoolMeta,
} from "@/lib/constants";
import type { PoolData } from "@/lib/hooks";
import { Countdown } from "@/components/countdown";
import { RegisterInterestDialog } from "@/components/register-interest-dialog";
import { StarRating } from "@/components/star-rating";

export function PoolCard({ pool }: { pool: PoolData }) {
  const target = pool.moq;
  const pct = target > 0n ? Number((pool.totalUnits * 100n) / target) : 0;

  const sector = getSector(pool.productName);
  const uiStatus = getPoolUIStatus(pool.id, pool.status);
  const closedMeta = getClosedPoolMeta(pool.id);
  const isClickable = uiStatus === "Active" || uiStatus === "Closed";

  const statusBadge = (() => {
    switch (uiStatus) {
      case "Active":
        return (
          <Badge
            variant="outline"
            className="shrink-0 text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
          >
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Open
          </Badge>
        );
      case "Evaluating":
        return (
          <Badge
            variant="outline"
            className="shrink-0 text-xs bg-amber-500/15 text-amber-400 border-amber-500/25"
          >
            Evaluating
          </Badge>
        );
      case "Closed":
        return (
          <Badge
            variant="outline"
            className="shrink-0 text-xs bg-zinc-500/15 text-zinc-400 border-zinc-500/25"
          >
            Closed
          </Badge>
        );
    }
  })();

  const card = (
    <Card className={`group h-full overflow-hidden transition-all duration-300 ${
      isClickable
        ? "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer"
        : "opacity-60 cursor-default"
    }`}>
      <div className={`h-[2px] w-full ${
        uiStatus === "Active"
          ? "bg-gradient-to-r from-emerald-500 via-primary to-violet-500"
          : uiStatus === "Evaluating"
            ? "bg-gradient-to-r from-amber-500/50 via-amber-400/30 to-amber-500/50"
            : "bg-gradient-to-r from-zinc-600/30 via-zinc-500/20 to-zinc-600/30"
      }`} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
            {pool.productName}
          </CardTitle>
          {statusBadge}
        </div>
        {sector && (
          <span className="text-xs text-muted-foreground">
            {SECTOR_ICONS[sector]} {sector}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pb-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatUsdc(pool.pricePerUnit)} mUSDC / unit</span>
          <span>
            MOQ: {target.toString()} units
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/70">
              {pool.totalUnits.toString()} / {target.toString()} units
            </span>
            <span className="font-bold text-primary">{Math.min(pct, 100)}%</span>
          </div>
          <Progress value={Math.min(pct, 100)} className="gradient-progress" />
        </div>
        {uiStatus === "Active" && pool.totalUnits >= target && (
          <p className="text-xs font-medium text-emerald-400">
            MOQ met. Still accepting commits for better rates
          </p>
        )}
        {closedMeta && (
          <div className="flex items-center justify-between">
            <StarRating rating={closedMeta.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {closedMeta.totalBuyers} buyers
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground flex flex-col items-stretch gap-2">
        {uiStatus === "Active" ? (
          <Countdown deadline={pool.deadline} />
        ) : uiStatus === "Evaluating" ? (
          <RegisterInterestDialog productName={pool.productName} />
        ) : (
          <div className="flex items-center justify-between">
            <span>Closed {closedMeta?.closedDate ?? ""}</span>
            <RegisterInterestDialog
              productName={pool.productName}
              buttonSize="sm"
              buttonClassName="text-xs"
              buttonLabel="Re-open Interest"
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );

  if (isClickable) {
    return <Link href={`/pools/${pool.id}`}>{card}</Link>;
  }

  return card;
}
