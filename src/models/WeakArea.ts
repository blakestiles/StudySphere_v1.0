import mongoose, { Schema, models } from "mongoose";

const WeakAreaSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
  severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  lastUpdated: { type: Date, default: Date.now },
});

WeakAreaSchema.index({ userId: 1, topicId: 1 }, { unique: true });

const WeakArea = models.WeakArea || mongoose.model("WeakArea", WeakAreaSchema);
export default WeakArea;
