import mongoose from "mongoose";

const goalLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 👇 DAY KEY (NO TIMEZONE ISSUES)
    date: {
      type: String, // "2026-01-27"
      required: true,
    },

    nutritionCalories: { type: Number, default: 0 },
    activityMinutes: { type: Number, default: 0 },
    sleepMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One log per user per day
goalLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// ❌ REMOVE TTL INDEX (VERY IMPORTANT)
// Exact 30 days should be enforced via queries, not TTL

const GoalLog =
  mongoose.models.GoalLog ||
  mongoose.model("GoalLog", goalLogSchema);

export default GoalLog;
