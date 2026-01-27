import express from "express";
import GoalLog from "../models/goalLogModel.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ===================== POST (UPSERT DAILY LOG) ===================== */
router.post("/log", requireAuth, async (req, res) => {
  try {
    const {
      date = new Date(),
      nutritionCalories = 0,
      activityMinutes = 0,
      sleepMinutes = 0,
    } = req.body;

    // 👇 Convert to YYYY-MM-DD
    const dateKey = new Date(date).toISOString().slice(0, 10);

    const log = await GoalLog.findOneAndUpdate(
      { userId: req.user._id, date: dateKey },
      { nutritionCalories, activityMinutes, sleepMinutes },
      { upsert: true, new: true }
    );

    res.json({ success: true, log });
  } catch (err) {
    console.error("Goal log error", err);
    res.status(500).json({ message: "Unable to store daily progress" });
  }
});


/* ===================== GET (LAST 30 DAYS / RANGE) ===================== */
router.get("/log", requireAuth, async (req, res) => {
  try {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);

    const startDate = new Date();
    startDate.setDate(today.getDate() - 29);
    const start = startDate.toISOString().slice(0, 10);

    const logs = await GoalLog.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .lean();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Unable to fetch logs" });
  }
});

export default router;
