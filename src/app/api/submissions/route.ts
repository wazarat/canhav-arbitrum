import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/contacts";

function hubspotHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
  };
}

async function pushToHubSpot(data: Record<string, unknown>) {
  if (!HUBSPOT_TOKEN) return;

  const email = String(data.email ?? "").trim();
  if (!email) return;

  const isComplete = data.step === "complete";

  const properties: Record<string, string> = {
    email,
    lifecyclestage: "lead",
  };

  if (isComplete) {
    if (data.yourName) {
      const parts = String(data.yourName).split(" ");
      properties.firstname = parts[0];
      if (parts.length > 1) properties.lastname = parts.slice(1).join(" ");
    }
    if (data.businessName) properties.company = String(data.businessName);
    if (data.phone) properties.phone = String(data.phone);
    properties.hs_lead_status = "NEW";
  }

  try {
    const createRes = await fetch(HUBSPOT_API, {
      method: "POST",
      headers: hubspotHeaders(),
      body: JSON.stringify({ properties }),
    });

    if (createRes.status === 409) {
      let existingId: string | undefined;
      try {
        const conflict = await createRes.json();
        existingId = conflict?.message?.match(/Existing ID: (\d+)/)?.[1];
      } catch { /* response parse failed, skip update */ }

      if (existingId) {
        await fetch(`${HUBSPOT_API}/${existingId}`, {
          method: "PATCH",
          headers: hubspotHeaders(),
          body: JSON.stringify({ properties }),
        });
      }
    } else if (!createRes.ok) {
      const errBody = await createRes.text().catch(() => "unknown");
      console.error(`[HubSpot] Create failed (${createRes.status}):`, errBody);
    }
  } catch (err) {
    console.error("[HubSpot] Network error:", err);
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
  await redis.lpush(key, JSON.stringify(entry));

  if (type === "lead-capture") {
    try {
      await pushToHubSpot(data);
    } catch (err) {
      console.error("[HubSpot] Unexpected error:", err);
    }
  }

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
