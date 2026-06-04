import { NextRequest, NextResponse } from "next/server";

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;

const ACCEPTED_TYPES = ["register-interest", "request-pool", "lead-capture"];

/* Instantly.ai: add lead to campaign (email only) */

async function pushToInstantly(data: Record<string, unknown>): Promise<boolean> {
  const email = String(data.email ?? "").trim();
  if (!email) return false;

  const customVariables: Record<string, string> = {};
  if (data.source) customVariables.source = String(data.source);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    if (data[key]) customVariables[key] = String(data[key]);
  }

  const res = await fetch("https://api.instantly.ai/api/v2/leads/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INSTANTLY_API_KEY}`,
    },
    body: JSON.stringify({
      campaign_id: INSTANTLY_CAMPAIGN_ID,
      skip_if_in_workspace: true,
      leads: [{ email, custom_variables: customVariables }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "unknown");
    console.error(`[Instantly] Add lead failed (${res.status}):`, errBody);
    return false;
  }
  return true;
}

/* POST handler */

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, ...data } = body;

  if (!type || !ACCEPTED_TYPES.includes(String(type))) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const email = String(data.email ?? "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  if (!INSTANTLY_API_KEY || !INSTANTLY_CAMPAIGN_ID) {
    console.error("[Pipeline] Instantly is not configured (INSTANTLY_API_KEY / INSTANTLY_CAMPAIGN_ID)");
    return NextResponse.json(
      { error: "Waitlist not configured. Contact support." },
      { status: 503 },
    );
  }

  try {
    const ok = await pushToInstantly(data);
    if (!ok) {
      return NextResponse.json({ error: "Failed to record email" }, { status: 502 });
    }
  } catch (err) {
    console.error("[Instantly] Network error:", err);
    return NextResponse.json({ error: "Failed to record email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
