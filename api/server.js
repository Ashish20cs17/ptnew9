const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// Database connection setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "questions_db",
});

db.connect((err) => {
  if (err) {
    console.log("Database connection error:", err);
  } else {
    console.log("Connected to MySQL Database!");
  }
});

app.post("/upload-question", (req, res) => {
  const {
    questionType,
    question,
    grade,
    topic,
    difficultyLevel,
    mcqAnswer,
    options,
  } = req.body;

  const query = `
    INSERT INTO questions (questionType, question, grade, topic, difficultyLevel, mcqAnswer, options) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    questionType,
    question,
    grade,
    topic,
    difficultyLevel,
    mcqAnswer,
    JSON.stringify(options), // Store options as JSON string
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error uploading question:", err);
      res.status(500).json({ success: false, message: "Database error" });
    } else {
      res.status(200).json({ success: true, message: "Question uploaded successfully!" });
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
