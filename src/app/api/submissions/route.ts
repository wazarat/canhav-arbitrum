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
  const { type, ...data } = body;

  if (!type || !["register-interest", "request-pool", "lead-capture"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const entry = {
    ...data,
    type,
    submittedAt: new Date().toISOString(),
  };

  const key = `submissions:${type}`;
  await redis.lpush(key, JSON.stringify(entry));

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
  const secret = searchParams.get("secret");

  if (secret !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = searchParams.get("type") || "all";

  if (type === "all") {
    const [interests, requests, leads] = await Promise.all([
      redis.lrange("submissions:register-interest", 0, -1),
      redis.lrange("submissions:request-pool", 0, -1),
      redis.lrange("submissions:lead-capture", 0, -1),
    ]);
    return NextResponse.json({
      "register-interest": interests.map(parse),
      "request-pool": requests.map(parse),
      "lead-capture": leads.map(parse),
    });
  }

  const entries = await redis.lrange(`submissions:${type}`, 0, -1);
  return NextResponse.json({ [type]: entries.map(parse) });
}

function parse(entry: unknown) {
  if (typeof entry === "string") {
    try { return JSON.parse(entry); } catch { return entry; }
  }
  return entry;
}
