import mongoose, { Schema, models } from "mongoose";

const ReminderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["review_due", "inactive_topic", "exam_countdown", "goal_deadline", "general"],
    required: true,
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  triggerDate: { type: Date, required: true },
  relatedId: { type: Schema.Types.ObjectId },
  relatedModel: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Reminder = models.Reminder || mongoose.model("Reminder", ReminderSchema);
export default Reminder;
