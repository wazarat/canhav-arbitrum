import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN ? `SET (${process.env.HUBSPOT_TOKEN.slice(0, 6)}...${process.env.HUBSPOT_TOKEN.slice(-4)})` : "MISSING",
    INSTANTLY_API_KEY: process.env.INSTANTLY_API_KEY ? `SET (${process.env.INSTANTLY_API_KEY.slice(0, 6)}...${process.env.INSTANTLY_API_KEY.slice(-4)})` : "MISSING",
    INSTANTLY_CAMPAIGN_ID: process.env.INSTANTLY_CAMPAIGN_ID ? `SET (${process.env.INSTANTLY_CAMPAIGN_ID.slice(0, 6)}...)` : "MISSING",
    KV_REST_API_URL: process.env.KV_REST_API_URL ? "SET" : "MISSING",
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? "SET" : "MISSING",
    ADMIN_API_SECRET: process.env.ADMIN_API_SECRET ? "SET" : "MISSING",
    NODE_ENV: process.env.NODE_ENV ?? "unknown",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "unknown",
  });
}
