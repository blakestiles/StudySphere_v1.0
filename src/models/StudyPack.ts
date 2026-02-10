import mongoose, { Schema, models } from "mongoose";

const StudyPackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    title: { type: String, required: true },
    summaries: {
      short: { type: String, default: "" },
      detailed: { type: String, default: "" },
    },
    status: { type: String, enum: ["generating", "ready", "error"], default: "generating" },
  },
  { timestamps: true }
);

const StudyPack = models.StudyPack || mongoose.model("StudyPack", StudyPackSchema);
export default StudyPack;
