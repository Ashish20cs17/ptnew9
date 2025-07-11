import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // or "gemini-1.0-pro"
    const result = await model.generateContent("Write a short performance summary of a student.");
    const response = await result.response;
    const text = response.text();
    console.log("✅ Gemini Response:\n", text);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
  }
}

test();
