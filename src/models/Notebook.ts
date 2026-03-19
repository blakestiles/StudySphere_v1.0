import mongoose, { Schema, models } from "mongoose";

const NotebookSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack" },
  title: { type: String, required: true, default: "Untitled Notebook" },
  cues: { type: String, default: "" },
  notes: { type: String, default: "" },
  summary: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Notebook = models.Notebook || mongoose.model("Notebook", NotebookSchema);
export default Notebook;
