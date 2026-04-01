import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

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

/* ─── HubSpot: create/update contact + attach qualifying note ─── */

async function pushToHubSpot(data: Record<string, unknown>): Promise<string | undefined> {
  if (!HUBSPOT_TOKEN) return undefined;

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
      await attachNoteToContact(contactId, data);
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

  lines.push(`<strong>CanHav Lead Submission (${step})</strong>`);
  lines.push("");

  if (data.industry) lines.push(`<b>Industry:</b> ${String(data.industry)}`);
  if (data.supplies) lines.push(`<b>Supplies:</b> ${String(data.supplies)}`);
  if (data.heardAboutUs) lines.push(`<b>How they heard about us:</b> ${String(data.heardAboutUs)}`);
  if (data.source) lines.push(`<b>Source domain:</b> ${String(data.source)}`);

  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const utms = utmFields.filter((k) => data[k]).map((k) => `${k}=${String(data[k])}`);
  if (utms.length > 0) lines.push(`<b>Attribution:</b> ${utms.join(", ")}`);

  return lines.join("<br/>");
}

async function attachNoteToContact(contactId: string, data: Record<string, unknown>) {
  const hasQualifyingData = data.industry || data.supplies || data.heardAboutUs ||
    data.utm_source || data.utm_medium || data.utm_campaign || data.source;
  if (!hasQualifyingData) return;

  const noteBody = buildNoteBody(data);

  try {
    await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
      method: "POST",
      headers: hubspotHeaders(),
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [{
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        }],
      }),
    });
  } catch (err) {
    console.error("[HubSpot] Failed to attach note:", err);
  }
}

/* ─── Instantly.ai: add lead to campaign for automated follow-up ─── */

async function pushToInstantly(data: Record<string, unknown>) {
  if (!INSTANTLY_API_KEY || !INSTANTLY_CAMPAIGN_ID) return;

  const email = String(data.email ?? "").trim();
  if (!email) return;

  const variables: Record<string, string> = {};
  if (data.yourName) variables.name = String(data.yourName);
  if (data.businessName) variables.company_name = String(data.businessName);
  if (data.industry) variables.industry = String(data.industry);
  if (data.phone) variables.phone = String(data.phone);
  if (data.supplies) variables.supplies = String(data.supplies);
  if (data.source) variables.source = String(data.source);

  try {
    const res = await fetch("https://api.instantly.ai/api/v1/lead/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: INSTANTLY_API_KEY,
        campaign_id: INSTANTLY_CAMPAIGN_ID,
        skip_if_in_workspace: true,
        leads: [{
          email,
          first_name: variables.name?.split(" ")[0] ?? "",
          last_name: variables.name?.split(" ").slice(1).join(" ") ?? "",
          company_name: variables.company_name ?? "",
          custom_variables: variables,
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

/* ─── Main POST handler ─── */

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
  try {
    await redis.lpush(key, JSON.stringify(entry));
  } catch (err) {
    console.error("[Redis] lpush failed:", err);
    return NextResponse.json({ error: "Storage write failed" }, { status: 503 });
  }

  if (type === "lead-capture") {
    const isComplete = data.step === "complete";

    try {
      await pushToHubSpot(data);
    } catch (err) {
      console.error("[HubSpot] Unexpected error:", err);
    }

    if (isComplete) {
      try {
        await pushToInstantly(data);
      } catch (err) {
        console.error("[Instantly] Unexpected error:", err);
      }
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
