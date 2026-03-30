import { NextRequest, NextResponse } from "next/server";

const INSTANTLY_WEBHOOK_SECRET = process.env.INSTANTLY_WEBHOOK_SECRET;
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const HUBSPOT_CONTACTS = "https://api.hubapi.com/crm/v3/objects/contacts";

/**
 * Instantly.ai webhook receiver.
 *
 * When a lead replies to an Instantly campaign, Instantly fires a webhook
 * to this endpoint. We look up the contact in HubSpot by email and update
 * their lead status to reflect the reply.
 *
 * Instantly webhook payload (reply event):
 * {
 *   "event_type": "reply_received",
 *   "email": "owner@business.com",
 *   "campaign_id": "...",
 *   "campaign_name": "Coffee Shops - GTA",
 *   "reply_text": "...",
 *   "timestamp": "2026-03-29T..."
 * }
 *
 * Setup:
 * 1. In Instantly > Settings > Webhooks, add endpoint: https://canhav.io/api/webhooks/instantly
 * 2. Set INSTANTLY_WEBHOOK_SECRET env var in Vercel to match the secret Instantly provides
 * 3. Set event filter to "reply_received" (or leave all if you want lead_opened etc.)
 */
export async function POST(req: NextRequest) {
  if (INSTANTLY_WEBHOOK_SECRET) {
    const authHeader = req.headers.get("x-instantly-signature")
      ?? req.headers.get("authorization")
      ?? "";
    if (!authHeader.includes(INSTANTLY_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = String(body.event_type ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    reply_received: "CONNECTED",
    lead_interested: "CONNECTED",
    lead_not_interested: "UNQUALIFIED",
    email_bounced: "BAD_TIMING",
    lead_opened: "OPEN",
  };

  const newStatus = statusMap[eventType];
  if (!newStatus) {
    return NextResponse.json({ ok: true, skipped: true, reason: "unhandled event type" });
  }

  if (!HUBSPOT_TOKEN) {
    return NextResponse.json({ error: "HubSpot not configured" }, { status: 503 });
  }

  try {
    const searchRes = await fetch(`${HUBSPOT_CONTACTS}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: email }],
        }],
      }),
    });

    if (!searchRes.ok) {
      const errBody = await searchRes.text().catch(() => "unknown");
      console.error(`[Instantly Webhook] HubSpot search failed (${searchRes.status}):`, errBody);
      return NextResponse.json({ error: "HubSpot search failed" }, { status: 502 });
    }

    const searchData = await searchRes.json();
    const contactId = searchData?.results?.[0]?.id;

    if (!contactId) {
      return NextResponse.json({ ok: true, skipped: true, reason: "contact not found in HubSpot" });
    }

    const properties: Record<string, string> = {
      hs_lead_status: newStatus,
    };

    await fetch(`${HUBSPOT_CONTACTS}/${contactId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      },
      body: JSON.stringify({ properties }),
    });

    const campaignName = body.campaign_name ? String(body.campaign_name) : undefined;
    const replyText = body.reply_text ? String(body.reply_text) : undefined;

    if (replyText || campaignName) {
      const noteLines = [`<strong>Instantly ${eventType}</strong>`];
      if (campaignName) noteLines.push(`<b>Campaign:</b> ${campaignName}`);
      if (replyText) noteLines.push(`<b>Reply:</b> ${replyText.slice(0, 500)}`);

      await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: noteLines.join("<br/>"),
            hs_timestamp: new Date().toISOString(),
          },
          associations: [{
            to: { id: contactId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
          }],
        }),
      });
    }

    return NextResponse.json({ ok: true, contactId, status: newStatus });
  } catch (err) {
    console.error("[Instantly Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
