import mongoose, { Schema, models } from "mongoose";

const ReviewStatsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: Date, required: true },
  cardsReviewed: { type: Number, default: 0 },
  cardsCorrect: { type: Number, default: 0 },
  studyMinutes: { type: Number, default: 0 },
  quizzesTaken: { type: Number, default: 0 },
  quizAvgScore: { type: Number, default: 0 },
  essaysWritten: { type: Number, default: 0 },
});

// Compound index: one entry per user per day
ReviewStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

const ReviewStats = models.ReviewStats || mongoose.model("ReviewStats", ReviewStatsSchema);
export default ReviewStats;
