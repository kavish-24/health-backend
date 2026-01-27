import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { protect } from "../middlewares/authMiddleware.js";

dotenv.config();
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/health-analysis", protect, async (req, res) => {
  try {
    const { userData, communityData } = req.body;

    if (!userData || !communityData) {
      return res.status(400).json({ error: "userData and communityData are required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp"
    });

    const prompt = `
You are an AI health advisor analyzing individual health data against community health trends.

USER PROFILE:
- Name: ${userData.name || 'User'}
- Age: ${userData.age || 'Unknown'}
- Recent Activity: ${userData.recentActivity || 'No data'}
- Recent Goals: ${userData.recentGoals || 'No data'}

COMMUNITY HEALTH TRENDS (Local Area):
- Top Symptoms in Area: ${communityData.topSymptoms.map(s => `${s.symptom} (${s.percentage}%)`).join(', ')}
- Active Health Alerts: ${communityData.alerts.map(a => a.title).join(', ')}
- Risk Hotspots: ${communityData.hotspots.length} active zones
- Trend: ${communityData.trendChange}% change vs last week

ANALYSIS REQUIREMENTS:
1. Compare user's profile with community health patterns
2. Identify preventive measures based on local health trends
3. Suggest personalized precautions considering local outbreaks
4. Recommend lifestyle adjustments
5. Highlight when to seek medical attention

CRITICAL RULES:
- Do NOT diagnose any medical condition
- Do NOT prescribe medicines
- Focus on PREVENTION and AWARENESS
- Use community data to provide context-aware advice
- Keep tone supportive and informative

OUTPUT FORMAT (JSON ONLY):
{
  "riskAssessment": {
    "level": "Low | Moderate | High",
    "factors": ["factor1", "factor2"]
  },
  "precautionarySteps": [
    {
      "category": "Hygiene | Nutrition | Exercise | etc",
      "action": "specific action",
      "priority": "High | Medium | Low",
      "reason": "why this is important based on trends"
    }
  ],
  "localHealthContext": {
    "relevantTrends": ["trend1", "trend2"],
    "exposureRisks": ["risk1", "risk2"]
  },
  "lifestyleRecommendations": [
    {
      "area": "Sleep | Diet | Exercise | Stress",
      "suggestion": "specific suggestion",
      "benefit": "expected benefit"
    }
  ],
  "whenToSeekHelp": [
    "symptom or condition to watch for"
  ],
  "disclaimer": "This is not medical advice. Consult healthcare professionals for medical concerns."
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.
`;

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
