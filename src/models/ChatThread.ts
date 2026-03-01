import mongoose, { Schema, models } from "mongoose";

const ChatThreadSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack" },
  title: { type: String, default: "New Chat" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ChatThread = models.ChatThread || mongoose.model("ChatThread", ChatThreadSchema);
export default ChatThread;
