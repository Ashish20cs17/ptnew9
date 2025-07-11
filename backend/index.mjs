import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import geminiRoutes from "./gemini.mjs";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/gemini", geminiRoutes); // ✅ Fixed route

app.listen(3001, () => {
  console.log("✅ Gemini API running on http://localhost:3001");
});
