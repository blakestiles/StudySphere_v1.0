import mongoose, { Schema, models } from "mongoose";

const AnnotationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
  type: { type: String, enum: ["highlight", "underline", "note"], default: "highlight" },
  color: { type: String, default: "#fbbf24" },
  startOffset: { type: Number, required: true },
  endOffset: { type: Number, required: true },
  selectedText: { type: String, default: "" },
  noteText: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Annotation = models.Annotation || mongoose.model("Annotation", AnnotationSchema);
export default Annotation;
