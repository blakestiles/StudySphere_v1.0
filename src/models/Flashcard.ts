import mongoose, { Schema, models } from "mongoose";

const FlashcardSchema = new Schema({
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  // SM-2 Spaced Repetition fields
  easeFactor: { type: Number, default: 2.5 },
  intervalDays: { type: Number, default: 0 },
  repetitions: { type: Number, default: 0 },
  nextReviewAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date },
});

const Flashcard = models.Flashcard || mongoose.model("Flashcard", FlashcardSchema);
export default Flashcard;
