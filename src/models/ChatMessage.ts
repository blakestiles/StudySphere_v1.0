import mongoose, { Schema, models } from "mongoose";

const ChatMessageSchema = new Schema({
  threadId: { type: Schema.Types.ObjectId, ref: "ChatThread", required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  citations: { type: Schema.Types.Mixed }, // JSON citations
  createdAt: { type: Date, default: Date.now },
});

const ChatMessage = models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema);
export default ChatMessage;
