import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateWorksheetFromGemini(promptText) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // ✅ use valid model
  const result = await model.generateContent(promptText);
  const response = await result.response;
  const text = response.text();
  return text;
}

// ✅ Test call
if (process.argv[1].endsWith("geminiService.js")) {
  generateWorksheetFromGemini("Generate 5 tricky math questions with answers")
    .then(console.log)
    .catch(console.error);
}
