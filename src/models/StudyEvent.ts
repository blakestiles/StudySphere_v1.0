import mongoose, { Schema, models } from "mongoose";

const StudyEventSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack" },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  date: { type: Date, required: true },
  startTime: { type: String }, // "HH:mm" format
  duration: { type: Number, default: 30 }, // minutes
  color: { type: String, default: "#3b82f6" },
  completed: { type: Boolean, default: false },
  isAiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const StudyEvent = models.StudyEvent || mongoose.model("StudyEvent", StudyEventSchema);
export default StudyEvent;
