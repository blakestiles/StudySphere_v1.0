import mongoose, { Schema, models } from "mongoose";

const WeeklyReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  summary: { type: String, required: true },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  recommendations: [{ type: String }],
  stats: {
    studyMinutes: { type: Number, default: 0 },
    quizzesTaken: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    cardsReviewed: { type: Number, default: 0 },
    essaysWritten: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

const WeeklyReport = models.WeeklyReport || mongoose.model("WeeklyReport", WeeklyReportSchema);
export default WeeklyReport;
