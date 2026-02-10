import mongoose, { Schema, models } from "mongoose";

const QuizAttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  responses: [
    {
      questionId: { type: Schema.Types.ObjectId, ref: "QuizQuestion" },
      selectedAnswer: { type: Number },
      isCorrect: { type: Boolean },
    },
  ],
  completedAt: { type: Date, default: Date.now },
});

const QuizAttempt = models.QuizAttempt || mongoose.model("QuizAttempt", QuizAttemptSchema);
export default QuizAttempt;
