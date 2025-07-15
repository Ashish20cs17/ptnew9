import express from "express";
import cors from "cors";
import { generateWorksheetFromGemini } from "./geminiService.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  const result = await generateWorksheetFromGemini(prompt);
  res.send({ text: result });
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
