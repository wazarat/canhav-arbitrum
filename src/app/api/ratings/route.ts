import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  if (!redis) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const { poolId, address, rating, comment } = body;

  if (
    poolId === undefined ||
    !address ||
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entry = {
    poolId,
    address: address.toLowerCase(),
    rating,
    comment: comment || "",
    submittedAt: new Date().toISOString(),
  };

  const userKey = `ratings:pool:${poolId}:${address.toLowerCase()}`;
  const listKey = `ratings:pool:${poolId}:all`;

  const existing = await redis.get(userKey);
  if (existing) {
    return NextResponse.json(
      { error: "Already rated this pool" },
      { status: 409 },
    );
  }

  await redis.set(userKey, JSON.stringify(entry));
  await redis.lpush(listKey, JSON.stringify(entry));

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  if (!redis) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const poolId = searchParams.get("poolId");
  const address = searchParams.get("address");

  if (!poolId) {
    return NextResponse.json({ error: "poolId required" }, { status: 400 });
  }

  const listKey = `ratings:pool:${poolId}:all`;
  const rawEntries = await redis.lrange(listKey, 0, -1);

  const entries = rawEntries.map((e) => {
    if (typeof e === "string") {
      try {
        return JSON.parse(e);
      } catch {
        return e;
      }
    }
    return e;
  }) as Array<{ rating: number; comment: string; address: string; submittedAt: string }>;

  const count = entries.length;
  const avgRating =
    count > 0
      ? entries.reduce((sum, e) => sum + (e.rating ?? 0), 0) / count
      : 0;

  let userRating = null;
  if (address) {
    const userKey = `ratings:pool:${poolId}:${address.toLowerCase()}`;
    const raw = await redis.get(userKey);
    if (raw) {
      userRating =
        typeof raw === "string" ? JSON.parse(raw) : raw;
    }
  }

  return NextResponse.json({
    poolId: Number(poolId),
    avgRating: Math.round(avgRating * 10) / 10,
    count,
    userRating,
  });
}
