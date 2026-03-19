import mongoose, { Schema, models } from "mongoose";

const FocusSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack" },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  duration: { type: Number, required: true },
  goals: [{ type: String }],
  completedGoals: [{ type: Number }],
  recap: { type: String },
  completedAt: { type: Date },
  // Pomodoro fields
  workDuration: { type: Number, default: 25 },
  shortBreakDuration: { type: Number, default: 5 },
  longBreakDuration: { type: Number, default: 15 },
  sessionsCompleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const FocusSession = models.FocusSession || mongoose.model("FocusSession", FocusSessionSchema);
export default FocusSession;
