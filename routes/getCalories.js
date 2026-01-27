import express from "express";
import axios from "axios"
const router = express.Router();

router.post("/", async (req, res) => {
  const { food } = req.body;

  if (!food) {
    return res.status(400).json({ error: "Food name is required" });
  }

  try {
    const response = await axios.post(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=G6N8mtMMwYXXW9dymbeDZ1hez9HKZJQcA2GvmI2A`,
      {
        query: food,
        pageSize: 1
      }
    );

    const nutrients = response.data.foods[0].foodNutrients;

    const calories = nutrients.find(
      n => n.nutrientName === "Energy" && n.unitName === "KCAL"
    )?.value;

    res.json({
      food,
      calories_per_100g: calories,
      unit: "kcal"
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch calorie data"
    });
  }
});
export default router;