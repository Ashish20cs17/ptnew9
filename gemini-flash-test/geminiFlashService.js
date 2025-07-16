// geminiFlashService.js ✅ CommonJS version


const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateWithFlash(promptText) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const candidates = response.data.candidates;
    if (candidates && candidates.length > 0) {
      return candidates[0].content.parts[0].text;
    } else {
      return "❌ No response from Gemini.";
    }
  } catch (err) {
    console.error("❌ Gemini API Error:", err.response?.data || err.message);
    return "Error generating content.";
  }
}
module.exports = { generateWithFlash }; 