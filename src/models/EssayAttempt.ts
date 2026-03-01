import mongoose, { Schema, models } from "mongoose";

const EssayAttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack" },
  question: { type: String, required: true },
  essayText: { type: String, required: true },
  wordCount: { type: Number, default: 0 },
  scores: {
    accuracy: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    criticalThinking: { type: Number, default: 0 },
    overall: { type: Number, default: 0 },
  },
  feedback: {
    perCriteria: {
      accuracy: { type: String, default: "" },
      depth: { type: String, default: "" },
      clarity: { type: String, default: "" },
      criticalThinking: { type: String, default: "" },
    },
    missedPoints: [{ type: String }],
    improvements: [{ type: String }],
    summary: { type: String, default: "" },
  },
  completedAt: { type: Date, default: Date.now },
});

const EssayAttempt = models.EssayAttempt || mongoose.model("EssayAttempt", EssayAttemptSchema);
export default EssayAttempt;
