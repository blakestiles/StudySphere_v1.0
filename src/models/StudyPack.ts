import mongoose, { Schema, models } from "mongoose";

const StudyPackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    title: { type: String, required: true },
    summaries: {
      short: { type: String, default: "" },
      detailed: { type: String, default: "" },
    },
    mindMap: { type: Schema.Types.Mixed, default: null }, // JSON mind map structure
    status: { type: String, enum: ["generating", "ready", "error"], default: "generating" },
    shareToken: { type: String, unique: true, sparse: true },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const StudyPack = models.StudyPack || mongoose.model("StudyPack", StudyPackSchema);
export default StudyPack;
