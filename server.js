import express from "express";
import cors from "cors";
import symptomCheckRoutes from "./routes/symptomcheck.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", symptomCheckRoutes);

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
