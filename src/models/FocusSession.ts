import mongoose, { Schema, models } from "mongoose";

const FocusSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack" },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  duration: { type: Number, required: true },
  goals: [{ type: String }],
  recap: { type: String },
  completedAt: { type: Date },
});

const FocusSession = models.FocusSession || mongoose.model("FocusSession", FocusSessionSchema);
export default FocusSession;
