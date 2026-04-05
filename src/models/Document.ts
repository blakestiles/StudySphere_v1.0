import mongoose, { Schema, models } from "mongoose";

const DocumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  originalFilename: { type: String },
  fileType: { type: String, enum: ["pdf", "text", "image", "url", "notion", "gdocs"], required: true },
  rawText: { type: String, required: true },
  status: { type: String, enum: ["processing", "ready", "error"], default: "ready" },
  uploadedAt: { type: Date, default: Date.now },
});

const Document = models.Document || mongoose.model("Document", DocumentSchema);
export default Document;
