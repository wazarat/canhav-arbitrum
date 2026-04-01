import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/contacts";
const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;

function hubspotHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
  };
}

/* ─── HubSpot: create or update contact ─── */

async function pushToHubSpot(data: Record<string, unknown>): Promise<string | undefined> {
  if (!HUBSPOT_TOKEN) {
    console.warn("[HubSpot] No HUBSPOT_TOKEN configured — skipping");
    return undefined;
  }

  const email = String(data.email ?? "").trim();
  if (!email) return undefined;

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
    let contactId: string | undefined;

    const createRes = await fetch(HUBSPOT_API, {
      method: "POST",
      headers: hubspotHeaders(),
      body: JSON.stringify({ properties }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      contactId = created?.id;
    } else if (createRes.status === 409) {
      let existingId: string | undefined;
      try {
        const conflict = await createRes.json();
        existingId = conflict?.message?.match(/Existing ID: (\d+)/)?.[1];
      } catch { /* parse failed */ }

      if (existingId) {
        contactId = existingId;
        await fetch(`${HUBSPOT_API}/${existingId}`, {
          method: "PATCH",
          headers: hubspotHeaders(),
          body: JSON.stringify({ properties }),
        });
      }
    } else {
      const errBody = await createRes.text().catch(() => "unknown");
      console.error(`[HubSpot] Create failed (${createRes.status}):`, errBody);
    }

    if (contactId) {
      await attachNote(contactId, data);
    }

    return contactId;
  } catch (err) {
    console.error("[HubSpot] Network error:", err);
    return undefined;
  }
}

function buildNoteBody(data: Record<string, unknown>): string {
  const lines: string[] = [];
  const step = String(data.step ?? "unknown");

  lines.push(`<strong>CanHav Lead (${step})</strong>`);

  if (data.industry) lines.push(`<b>Industry:</b> ${String(data.industry)}`);
  if (data.supplies) lines.push(`<b>Supplies:</b> ${String(data.supplies)}`);
  if (data.heardAboutUs) lines.push(`<b>Heard about us:</b> ${String(data.heardAboutUs)}`);
  if (data.source) lines.push(`<b>Domain:</b> ${String(data.source)}`);

  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const utms = utmFields.filter((k) => data[k]).map((k) => `${k}=${String(data[k])}`);
  if (utms.length > 0) lines.push(`<b>UTM:</b> ${utms.join(", ")}`);

  return lines.join("<br/>");
}

async function attachNote(contactId: string, data: Record<string, unknown>) {
  const hasData = data.industry || data.supplies || data.heardAboutUs || data.source ||
    data.utm_source || data.utm_medium || data.utm_campaign;
  if (!hasData) return;

  try {
    await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
      method: "POST",
      headers: hubspotHeaders(),
      body: JSON.stringify({
        properties: {
          hs_note_body: buildNoteBody(data),
          hs_timestamp: new Date().toISOString(),
        },
        associations: [{
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        }],
      }),
    });
  } catch (err) {
    console.error("[HubSpot] Note failed:", err);
  }
}

/* ─── Instantly.ai: add lead to campaign ─── */

async function pushToInstantly(data: Record<string, unknown>) {
  if (!INSTANTLY_API_KEY || !INSTANTLY_CAMPAIGN_ID) {
    console.warn("[Instantly] No API key or campaign ID configured — skipping");
    return;
  }

  const email = String(data.email ?? "").trim();
  if (!email) return;

  const firstName = data.yourName ? String(data.yourName).split(" ")[0] : "";
  const lastName = data.yourName ? String(data.yourName).split(" ").slice(1).join(" ") : "";

  const customVariables: Record<string, string> = {};
  if (data.industry) customVariables.industry = String(data.industry);
  if (data.phone) customVariables.phone = String(data.phone);
  if (data.supplies) customVariables.supplies = String(data.supplies);
  if (data.source) customVariables.source = String(data.source);

  try {
    const res = await fetch("https://api.instantly.ai/api/v2/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INSTANTLY_API_KEY}`,
      },
      body: JSON.stringify({
        campaign_id: INSTANTLY_CAMPAIGN_ID,
        skip_if_in_workspace: true,
        leads: [{
          email,
          first_name: firstName,
          last_name: lastName,
          company_name: data.businessName ? String(data.businessName) : "",
          custom_variables: customVariables,
        }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "unknown");
      console.error(`[Instantly] Add lead failed (${res.status}):`, errBody);
    }
  } catch (err) {
    console.error("[Instantly] Network error:", err);
  }
}

/* ─── Optional: Redis backup log ─── */

async function logToRedis(type: string, data: Record<string, unknown>) {
  try {
    const { redis } = await import("@/lib/redis");
    if (!redis) return;
    await redis.lpush(`submissions:${type}`, JSON.stringify({
      ...data,
      type,
      submittedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn("[Redis] Log failed (non-blocking):", err);
  }
}

/* ─── POST handler ─── */

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, ...data } = body;

  if (!type || !["register-interest", "request-pool", "lead-capture"].includes(String(type))) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (type === "lead-capture" && !HUBSPOT_TOKEN) {
    console.error("[Pipeline] HUBSPOT_TOKEN is not set — lead data will be lost");
    return NextResponse.json(
      { error: "CRM not configured. Contact support." },
      { status: 503 },
    );
  }

  const promises: Promise<unknown>[] = [];

  if (type === "lead-capture") {
    promises.push(pushToHubSpot(data).catch((err) => console.error("[HubSpot]", err)));

    if (data.step === "complete") {
      promises.push(pushToInstantly(data).catch((err) => console.error("[Instantly]", err)));
    }
  }

  promises.push(logToRedis(String(type), data));

  await Promise.allSettled(promises);

  return NextResponse.json({ ok: true });
}

/* ─── GET handler (admin) ─── */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { redis } = await import("@/lib/redis");
    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
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
  } catch {
    return NextResponse.json({ error: "Redis unavailable" }, { status: 503 });
  }
}

function parse(entry: unknown) {
  if (typeof entry === "string") {
    try { return JSON.parse(entry); } catch { return entry; }
  }
  return entry;
}
