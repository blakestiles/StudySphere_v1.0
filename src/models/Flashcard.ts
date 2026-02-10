import mongoose, { Schema, models } from "mongoose";

const FlashcardSchema = new Schema({
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
});

const Flashcard = models.Flashcard || mongoose.model("Flashcard", FlashcardSchema);
export default Flashcard;
