import mongoose, { Schema, models } from "mongoose";

const DoubtResolutionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  inputText: { type: String, required: true },
  explanation: { type: String, required: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack" },
  createdAt: { type: Date, default: Date.now },
});

const DoubtResolution = models.DoubtResolution || mongoose.model("DoubtResolution", DoubtResolutionSchema);
export default DoubtResolution;
