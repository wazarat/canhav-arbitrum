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

    // #region agent log
    fetch('http://127.0.0.1:7440/ingest/f7873869-39c1-4f0f-8ce4-a8bd7c72a5c4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0f87cc'},body:JSON.stringify({sessionId:'0f87cc',location:'route.ts:pushToHubSpot:done',message:'HubSpot sync complete',data:{contactId:contactId??'none',step:data.step,noteAttached:!!contactId},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
    // #endregion
  } catch (err) {
    console.error("[HubSpot] Network error:", err);
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

  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const utms = utmFields.filter((k) => data[k]).map((k) => `${k}=${String(data[k])}`);
  if (utms.length > 0) lines.push(`<b>Attribution:</b> ${utms.join(", ")}`);

  return lines.join("<br/>");
}

async function attachNoteToContact(contactId: string, data: Record<string, unknown>) {
  const hasQualifyingData = data.industry || data.supplies || data.heardAboutUs ||
    data.utm_source || data.utm_medium || data.utm_campaign;
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
