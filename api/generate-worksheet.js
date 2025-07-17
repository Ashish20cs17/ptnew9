// api/generate-worksheet.js

import { generateWithFlash } from '../gemini-flash-test/geminiFlashService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing prompt.' });
  }

  try {
    const result = await generateWithFlash(prompt);
    return res.status(200).json({ result });
  } catch (err) {
    console.error("❌ Error:", err.message);
    return res.status(500).json({ error: 'Failed to generate worksheet.' });
  }
}
