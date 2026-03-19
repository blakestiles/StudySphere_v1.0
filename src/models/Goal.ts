import mongoose, { Schema, models } from "mongoose";

const GoalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  targetType: {
    type: String,
    enum: ["flashcards_reviewed", "quiz_score", "study_minutes", "essays_written", "packs_completed", "custom"],
    required: true,
  },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  deadline: { type: Date },
  status: { type: String, enum: ["active", "completed", "abandoned"], default: "active" },
  aiSuggestion: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Goal = models.Goal || mongoose.model("Goal", GoalSchema);
export default Goal;
