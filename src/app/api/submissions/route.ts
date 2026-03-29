import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

async function pushToHubSpot(data: Record<string, unknown>) {
  if (!HUBSPOT_TOKEN) return;

  const email = String(data.email ?? "").trim();
  if (!email) return;

  const step = data.step as string | undefined;
  const isPartial = step === "partial";

  const properties: Record<string, string> = { email };

  if (data.industry) properties.industry = String(data.industry);

  if (!isPartial) {
    if (data.yourName) {
      const parts = String(data.yourName).split(" ");
      properties.firstname = parts[0];
      if (parts.length > 1) properties.lastname = parts.slice(1).join(" ");
    }
    if (data.businessName) properties.company = String(data.businessName);
    if (data.phone) properties.phone = String(data.phone);
    if (data.supplies) properties.message = String(data.supplies);
    if (data.heardAboutUs) properties.hs_analytics_source = String(data.heardAboutUs);
    properties.hs_lead_status = "NEW";
  }

  if (data.utm_source) properties.hs_analytics_source = String(data.utm_source);
  if (data.utm_medium) properties.utm_medium = String(data.utm_medium);
  if (data.utm_campaign) properties.utm_campaign = String(data.utm_campaign);

  try {
    const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      },
      body: JSON.stringify({ properties }),
    });

    if (createRes.status === 409) {
      const conflict = await createRes.json();
      const existingId = conflict?.message?.match(/Existing ID: (\d+)/)?.[1];
      if (existingId) {
        await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          },
          body: JSON.stringify({ properties }),
        });
      }
    }
  } catch (err) {
    console.error("[HubSpot] Failed to sync contact:", err);
  }
}

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
  const redisPromise = redis.lpush(key, JSON.stringify(entry));

  const hubspotPromise = type === "lead-capture"
    ? pushToHubSpot(data)
    : Promise.resolve();

  await Promise.all([redisPromise, hubspotPromise]);

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
