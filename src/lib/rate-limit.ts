import connectDB from "@/lib/db";
import RateLimitEntry from "@/models/RateLimit";

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  await connectDB();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  // Single atomic upsert: if a live window exists, increment; otherwise create one with count 1.
  // Retry once on E11000 duplicate key (race between TTL cleanup and concurrent insert).
  let entry;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      entry = await RateLimitEntry.findOneAndUpdate(
        { key: identifier, expiresAt: { $gt: now } },
        { $inc: { count: 1 }, $setOnInsert: { key: identifier, expiresAt } },
        { upsert: true, returnDocument: "after" }
      );
      break;
    } catch (err: any) {
      if (err?.code === 11000 && attempt === 0) continue;
      throw err;
    }
  }

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.expiresAt.getTime() };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.expiresAt.getTime(),
  };
}
