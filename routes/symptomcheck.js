import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/symptom-check", async (req, res) => {
  try {
    const { symptomsText } = req.body;

    if (!symptomsText || symptomsText.trim().length === 0) {
      return res.status(400).json({ error: "symptomsText is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
You are a medical symptom checker assistant.

STEP 1: Extract symptoms from the user's text.
STEP 2: Analyze severity.
STEP 3: Give guidance.

STRICT RULES:
- Do NOT give a medical diagnosis
- Do NOT prescribe medicines or dosages
- Do NOT claim certainty
- This is NOT medical advice

OUTPUT FORMAT (JSON ONLY):
{
  "extractedSymptoms": [],
  "severity": "Mild | Possibly Severe",
  "possibleCauses": [],
  "reliefSuggestions": [],
  "warningSigns": [],
  "disclaimer": "..."
}

User text:
"${symptomsText}"
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Remove markdown code blocks if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Safe JSON parsing
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("JSON Parse Error:", err.message);
      console.error("Raw response:", text);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    res.json({
      success: true,
      data: parsed
    });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: "Failed to analyze symptoms" });
  }
});

export default router;
