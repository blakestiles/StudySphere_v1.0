import mongoose, { Schema, models } from "mongoose";

const QuizQuestionSchema = new Schema({
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true, index: true },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: "" },
});

const QuizQuestion = models.QuizQuestion || mongoose.model("QuizQuestion", QuizQuestionSchema);
export default QuizQuestion;
