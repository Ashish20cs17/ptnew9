// gemini.mjs
import express from "express";
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // lighter & fast
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reportText = response.text();

    return res.status(200).json({ reportText });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
