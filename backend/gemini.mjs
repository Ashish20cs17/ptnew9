// ✅ Load environment variables from .env file
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function test() {
  try {
    // ✅ Use a valid model name: "gemini-1.5-flash" (lighter & quota-friendly) OR "gemini-1.5-pro"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent("Write a simple quiz summary.");
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini Response:\n", text);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
  }
}

test();
