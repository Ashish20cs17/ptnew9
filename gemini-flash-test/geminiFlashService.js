// /gemini-flash-test/geminiFlashService.js

const axios = require("axios");

const API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateWithFlash(promptText) {
  if (!API_KEY) {
    console.error("❌ Missing GOOGLE_API_KEY in environment");
    return "API key not set.";
  }

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

    const candidates = response.data?.candidates;
    if (candidates?.length > 0) {
      return candidates[0].content.parts[0].text;
    } else {
      return "❌ No response from Gemini.";
    }
  } catch (err) {
    console.error("❌ Gemini API Error:", err.response?.data || err.message);
    return "❌ Error generating content from Gemini.";
  }
}

module.exports = { generateWithFlash };
