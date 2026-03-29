"use server";

import { redis } from "@/lib/redis";

export interface SubmissionRecord {
  type: string;
  submittedAt: string;
  [key: string]: unknown;
}

function parse(entry: unknown): SubmissionRecord {
  if (typeof entry === "string") {
    try {
      return JSON.parse(entry);
    } catch {
      return { type: "unknown", submittedAt: "", raw: entry };
    }
  }
  return entry as SubmissionRecord;
}

export async function fetchSubmissions(): Promise<{
  interests: SubmissionRecord[];
  requests: SubmissionRecord[];
  leads: SubmissionRecord[];
  error?: string;
}> {
  if (!redis) {
    return { interests: [], requests: [], leads: [], error: "Storage not configured" };
  }

  try {
    const [interests, requests, leads] = await Promise.all([
      redis.lrange("submissions:register-interest", 0, -1),
      redis.lrange("submissions:request-pool", 0, -1),
      redis.lrange("submissions:lead-capture", 0, -1),
    ]);

    return {
      interests: interests.map(parse),
      requests: requests.map(parse),
      leads: leads.map(parse),
    };
  } catch (err) {
    return {
      interests: [],
      requests: [],
      leads: [],
      error: err instanceof Error ? err.message : "Failed to fetch",
    };
  }
}
