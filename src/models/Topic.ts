import mongoose, { Schema, models } from "mongoose";

const TopicSchema = new Schema({
  studyPackId: { type: Schema.Types.ObjectId, ref: "StudyPack", required: true, index: true },
  name: { type: String, required: true },
  parentTopicId: { type: Schema.Types.ObjectId, ref: "Topic" },
  content: { type: String, default: "" },
  order: { type: Number, default: 0 },
});

const Topic = models.Topic || mongoose.model("Topic", TopicSchema);
export default Topic;
