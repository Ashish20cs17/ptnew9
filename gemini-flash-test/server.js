const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { generateWithFlash } = require("./geminiFlashService");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/generate-worksheet", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid or missing prompt." });
  }

  try {
    const result = await generateWithFlash(prompt);
    res.json({ result });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Failed to generate worksheet." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Gemini backend running at http://localhost:${PORT}`);
});
