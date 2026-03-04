import mongoose, { Schema, models } from "mongoose";

const ClozeQuestionSchema = new Schema({
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true },
  originalText: { type: String, required: true },
  blankedText: { type: String, required: true },
  answers: [{ type: String }],
  topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  createdAt: { type: Date, default: Date.now },
});

const ClozeQuestion = models.ClozeQuestion || mongoose.model("ClozeQuestion", ClozeQuestionSchema);
export default ClozeQuestion;
