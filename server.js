import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import symptomCheckRoutes from "./routes/symptomcheck.js";
import authroutes from "./routes/auth.js";
import goalRoutes from "./routes/goallogs.js";
import getCalories from "./routes/getCalories.js"
import aiAnalysisRoutes from "./routes/aiAnalysis.js";
import { connectDB } from "./utils/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use("/api", symptomCheckRoutes);
app.use('/api/auth', authroutes);
app.use('/api/goals', goalRoutes);
app.use('/api/getCalories',getCalories);
app.use('/api/ai', aiAnalysisRoutes);

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

startServer();
