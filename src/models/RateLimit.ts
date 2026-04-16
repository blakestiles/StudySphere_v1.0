import mongoose, { Schema, models } from "mongoose";

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
  expiresAt: { type: Date, required: true },
});

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitEntry = models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);
export default RateLimitEntry;
