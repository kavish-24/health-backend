import express from "express";
import axios from "axios";

const router = express.Router();

// helper: get WHO access token
async function getWhoAccessToken() {
  const response = await axios.post(
    "https://icdaccessmanagement.who.int/connect/token",
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.WHO_CLIENT_ID,
      client_secret: process.env.WHO_CLIENT_SECRET,
      scope: "icdapi_access"
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return response.data.access_token;
}

// API-1
router.post("/", async (req, res) => {
  const { symptoms } = req.body;

  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ error: "Symptoms list is required" });
  }

  try {
    const token = await getWhoAccessToken();

    const results = [];

    for (const symptom of symptoms) {
      // 1️⃣ Search WHO
      const searchResp = await axios.get(
        `https://id.who.int/icd/entity/search?q=${encodeURIComponent(symptom)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "API-Version": "v2",
            "Accept-Language": "en"
          }
        }
      );

      // 2️⃣ Filter Chapter 21
      const chapter21 = searchResp.data.destinationEntities?.find(
        e => e.chapter === "21"
      );

      if (!chapter21) continue;

      // 3️⃣ Fetch entity details
      const entityResp = await axios.get(chapter21.id, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "API-Version": "v2",
          "Accept-Language": "en"
        }
      });

      // 4️⃣ Extract definition
      const definition =
        entityResp.data.definition?.["@value"] || null;

      if (definition) {
        results.push({
          symptom,
          whoId: chapter21.id,
          definition
        });
      }
    }

    res.json({
      source: "WHO ICD-11",
      count: results.length,
      definitions: results
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: "Failed to fetch WHO symptom definitions"
    });
  }
});
function extractJson(text) {
  if (!text || typeof text !== "string") return null;

  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}



router.post("/followUP/Qs", async (req, res) => {
  const { definitions } = req.body;

  if (!Array.isArray(definitions) || definitions.length === 0) {
    return res.status(400).json({ error: "Definitions are required" });
  }

  try {
    const prompt = `
You are a medical assistant.

The following symptoms are defined using WHO ICD-11 clinical definitions:

${definitions
  .map(d => `- ${d.symptom}: ${d.definition}`)
  .join("\n")}

TASK:
Generate follow-up questions to better understand the symptoms.

RULES:
- Do NOT diagnose
- Do NOT mention disease names
- Ask about duration, severity, progression, and red flags
- Output ONLY valid JSON
- JSON format must be:
-Note : Generate Maximum 5 question Only

{
  "questions": [
    "question 1",
    "question 2"
  ]
}
`;

    const geminiResp = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY
        },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    
    // Parse JSON safely
const rawText =
  geminiResp.data.candidates?.[0]?.content?.parts?.[0]?.text;

const cleanedText = extractJson(rawText);

let parsed;
try {
  parsed = JSON.parse(cleanedText);
} catch (err) {
  return res.status(500).json({
    error: "Gemini returned invalid JSON after cleanup",
    raw: rawText
  });
}

res.json({
  followUpQuestions: parsed.questions,
  disclaimer: "This is not a medical diagnosis."
});


  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to generate follow-up questions"
    });
  }
});



export default router;
