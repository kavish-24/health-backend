import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "../middlewares/authMiddleware.js";

dotenv.config();
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/health-analysis", requireAuth, async (req, res) => {
  try {
    const { userData, communityData } = req.body;

    if (!userData || !communityData) {
      return res.status(400).json({ error: "userData and communityData are required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `Preventive health AI for ${userData.name}, ${userData.age}y in Verna, Goa.

Local Health: ${communityData.topSymptoms.map(s => `${s.name} ${s.percentage}%`).join(', ')} | Alerts: ${communityData.activeAlerts.join(', ') || 'None'} | ${communityData.activeHotspots} hotspots | Trend: ${communityData.trendChange || '0'}%

Age ${userData.age} patterns: ${(() => {
  const userAgeGroup = Object.entries(communityData.demographicInsights || {}).find(([age]) => 
    userData.age >= parseInt(age.split('-')[0]) && userData.age <= parseInt(age.split('-')[1])
  );
  return userAgeGroup ? `${userAgeGroup[1].avgSleep}h sleep, ${userAgeGroup[1].avgStress}/10 stress, ${userAgeGroup[1].avgExercise}min exercise` : 'No data';
})()}

Generate: 4-6 actionable precautions (prioritized), 3-4 lifestyle tips, warning signs. Focus on prevention based on local trends. NO diagnosis/prescriptions.

Return JSON only:
{"riskAssessment":{"level":"Low|Moderate|High","factors":["up to 3"]},"precautionarySteps":[{"category":"Hygiene|Nutrition|Exercise|Sleep|Hydration|Stress","action":"specific step","priority":"High|Medium|Low","reason":"1 sentence"}],"localHealthContext":{"relevantTrends":["2-3"],"exposureRisks":["2-3"]},"lifestyleRecommendations":[{"area":"Sleep|Diet|Exercise|Stress","suggestion":"measurable action","benefit":"benefit"}],"whenToSeekHelp":["3-5 warning signs"],"disclaimer":"Preventive guidance only. Consult healthcare providers."}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const analysis = JSON.parse(text);
      res.json({ success: true, analysis });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", text);
      res.status(500).json({ 
        error: "Failed to parse AI response",
        rawResponse: text 
      });
    }

  } catch (err) {
    console.error("Gemini AI Analysis Error:", err);
    res.status(500).json({ 
      error: "AI analysis failed",
      message: err.message 
    });
  }
});

export default router;
