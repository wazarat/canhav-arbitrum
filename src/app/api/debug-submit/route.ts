import { NextResponse } from "next/server";

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/contacts";
const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;

export async function GET() {
  const results: Record<string, unknown> = {};
  const testEmail = `debug-${Date.now()}@test-canhav.com`;

  // Test HubSpot
  try {
    const res = await fetch(HUBSPOT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      },
      body: JSON.stringify({
        properties: {
          email: testEmail,
          lifecyclestage: "lead",
          firstname: "DebugTest",
          hs_lead_status: "NEW",
        },
      }),
    });

    const body = await res.text();
    results.hubspot = {
      status: res.status,
      ok: res.ok,
      body: body.slice(0, 500),
    };
  } catch (err) {
    results.hubspot = { error: String(err) };
  }

  // Test Instantly
  try {
    const res = await fetch("https://api.instantly.ai/api/v1/lead/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: INSTANTLY_API_KEY,
        campaign_id: INSTANTLY_CAMPAIGN_ID,
        skip_if_in_workspace: true,
        leads: [{
          email: testEmail,
          first_name: "DebugTest",
          last_name: "CanHav",
          company_name: "Debug Co",
        }],
      }),
    });

    const body = await res.text();
    results.instantly = {
      status: res.status,
      ok: res.ok,
      body: body.slice(0, 500),
    };
  } catch (err) {
    results.instantly = { error: String(err) };
  }

  return NextResponse.json(results);
}
