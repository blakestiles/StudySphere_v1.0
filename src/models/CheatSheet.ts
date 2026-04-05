import mongoose, { Schema, models } from "mongoose";

const CheatSheetSchema = new Schema(
  {
    userId:      { type: Schema.Types.ObjectId, ref: "User",      required: true, index: true },
    studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true, index: true },
    title:       { type: String, required: true },
    pages:       { type: Number, required: true, min: 1, max: 4 },
    content:     { type: String, required: true },
  },
  { timestamps: true }
);

const CheatSheet = models.CheatSheet || mongoose.model("CheatSheet", CheatSheetSchema);
export default CheatSheet;
