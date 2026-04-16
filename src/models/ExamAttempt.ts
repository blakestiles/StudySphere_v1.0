import mongoose, { Schema, models } from "mongoose";

const ExamAttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true, index: true },
  questions: [
    {
      questionText: { type: String, required: true },
      options: [{ type: String }],
      correctAnswer: { type: Number, required: true },
      difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    },
  ],
  responses: [
    {
      questionIndex: { type: Number, required: true },
      selectedAnswer: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true },
      timeSpent: { type: Number, default: 0 },
    },
  ],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard", "mixed"], default: "mixed" },
  duration: { type: Number, required: true },
  timeTaken: { type: Number, default: 0 },
  proctored: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "completed"], default: "completed" },
  completedAt: { type: Date, default: Date.now },
});

// Auto-delete pending exams after 24 hours
ExamAttemptSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 86400, partialFilterExpression: { status: "pending" } }
);

const ExamAttempt = models.ExamAttempt || mongoose.model("ExamAttempt", ExamAttemptSchema);
export default ExamAttempt;
