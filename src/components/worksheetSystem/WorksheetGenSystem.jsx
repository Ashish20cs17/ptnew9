// ✅ WorksheetGenSystem.jsx (Updated)

import React, { useState } from "react";
import { getDatabase, ref, push, get } from "firebase/database";
import Spinner from "../Spinner";
import "./WorksheetGenSystem.css";
import { toast } from "react-toastify";

const levels = ["Easy", "Medium", "Hard"];

const WorksheetGenSystem = () => {
  const [worksheetName, setWorksheetName] = useState("");
  const [childPhone, setChildPhone] = useState("");
  const [grade, setGrade] = useState("3");
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const toggleLevel = (level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };


const stripHTML = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const buildGeminiFallbackPrompt = (responses, grade) => {
  const fallbackExamples = responses
    .filter(r => !r.question && r.correctAnswer)
    .slice(0, 5)
    .map((r, i) => {
      return `
Example ${i + 1}:
Topic: ${r.topic || "Unknown"}
Subtopic: ${r.topicList || "N/A"}
Correct Answer: ${typeof r.correctAnswer === "object" ? JSON.stringify(r.correctAnswer) : r.correctAnswer}
Generate a matching question.`;
    })
    .join("\n\n");

  return `
Some past quiz entries are missing questions. Generate similar grade ${grade} level questions from the correct answers and topic info.

Return as JSON array:
[
  { "question": "...", "answer": "..." },
  ...
]

${fallbackExamples}
`.trim();
};



  // ✅ Get UID from phone number
  const getUidByPhone = async (phone) => {
    const db = getDatabase();
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return null;

    const usersData = snapshot.val();
    for (const uid in usersData) {
      if (usersData[uid].phone === phone) return uid;
    }
    return null;
  };

  // ✅ Fetch quiz data from Firebase
  const fetchQuizDataByUid = async (uid) => {
    const db = getDatabase();
    const quizRef = ref(db, `users/${uid}/quizResults`);
    const snapshot = await get(quizRef);
    if (!snapshot.exists()) return null;

    const quizData = snapshot.val();
    const latest = Object.values(quizData).sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    )[0];

    return latest;
  };

  // ✅ Gemini API fetch
  const generateWorksheetFromGemini = async (prompt) => {
 const res = await fetch("/api/generate-worksheet", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.result;
  };

const handleGenerate = async () => {
  setIsLoading(true);
  setMessage("");
  setQuestions([]);

  try {
    const uid = await getUidByPhone(childPhone);
    let prompt = "";
    let fallbackResponses = [];

    if (uid) {
      const db = getDatabase();
      const quizRef = ref(db, `users/${uid}/quizResults`);
      const snapshot = await get(quizRef);

      if (snapshot.exists()) {
        const allQuizData = Object.values(snapshot.val());
        const latest = allQuizData.sort(
          (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
        )[0];

        const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };
        const difficultyCorrect = { Easy: 0, Medium: 0, Hard: 0 };

        if (latest.responses) {
          latest.responses.forEach((res) => {
            const diff = res.difficulty || "Easy";
            difficultyCount[diff] = (difficultyCount[diff] || 0) + 1;
            if (res.result === "Correct") {
              difficultyCorrect[diff] = (difficultyCorrect[diff] || 0) + 1;
            }
          });

          // collect for fallback generation
          fallbackResponses = latest.responses.filter(
            (r) => !r.question && r.correctAnswer
          );
        }

        const easy_pct = (difficultyCorrect.Easy || 0) / (difficultyCount.Easy || 1);
        const medium_pct = (difficultyCorrect.Medium || 0) / (difficultyCount.Medium || 1);
        const hard_pct = (difficultyCorrect.Hard || 0) / (difficultyCount.Hard || 1);

        const adjustmentPrompt = `
Based on the student's last test performance:
- Easy: ${(easy_pct * 100).toFixed(0)}% correct
- Medium: ${(medium_pct * 100).toFixed(0)}% correct
- Hard: ${(hard_pct * 100).toFixed(0)}% correct

Recommend how to compose the next 8-question test.

Rules:
- If a student performs well in a difficulty (e.g., >70%), include more questions of that type.
- If performance is low (<50%), reduce or exclude that type.
- Total number of questions must be exactly 8.
- Distribute remaining questions wisely across other levels.

Return ONLY in the format:
Easy:[number],Medium:[number],Hard:[number]
`.trim();

        const distributionText = await generateWorksheetFromGemini(adjustmentPrompt);
        const match = distributionText.match(/Easy:(\d+),Medium:(\d+),Hard:(\d+)/);

        let easyQ = 4, medQ = 2, hardQ = 2;
        if (match) {
          easyQ = Number(match[1]);
          medQ = Number(match[2]);
          hardQ = Number(match[3]);
        }

        prompt = `Generate a worksheet for grade ${grade}.
Topic: ${topic || "Any"}, Subtopic: ${subTopic || "Any"}.
Include ${easyQ} Easy, ${medQ} Medium, and ${hardQ} Hard questions.
Return JSON ONLY like this:
{
  "sections": [
    { "difficulty": "Easy", "questions": [...] },
    { "difficulty": "Medium", "questions": [...] },
    { "difficulty": "Hard", "questions": [...] }
  ]
}`;
      }
    }

    // Fallback if no UID
    if (!prompt) {
      prompt = `Generate a worksheet for grade ${grade}.
Topic: ${topic || "Any"}, Subtopic: ${subTopic || "Any"}.
Include 4 Easy, 2 Medium, and 2 Hard questions.
Return JSON ONLY like this:
{
  "sections": [
    { "difficulty": "Easy", "questions": [...] },
    { "difficulty": "Medium", "questions": [...] },
    { "difficulty": "Hard", "questions": [...] }
  ]
}`;
    }

    const response = await generateWorksheetFromGemini(prompt);

    let cleaned = response.trim();
    if (cleaned.includes("```")) {
      cleaned = cleaned.replace(/```[\s\S]*?```/, (block) =>
        block.replace(/```json|```/g, "").trim()
      );
    }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ Invalid JSON from Gemini:", cleaned);
      setMessage("❌ Gemini returned invalid JSON. Please try again.");
      setIsLoading(false);
      return;
    }

    const flatQuestions = parsed.sections?.flatMap((sec) =>
      sec.questions.map((q) => ({
        difficulty: sec.difficulty,
        question_text: stripHTML(q.question || q.question_text || q.text || "No text"),
        options: q.options,
        answer: q.answer,
      }))
    );

    let finalQuestions = flatQuestions || [];

    // If fallback responses exist, regenerate those
    if (fallbackResponses.length > 0) {
      const fallbackPrompt = buildGeminiFallbackPrompt(fallbackResponses, grade);
      const fallbackResult = await generateWorksheetFromGemini(fallbackPrompt);

      try {
        const regenerated = JSON.parse(fallbackResult);
        const fallbackQs = regenerated.map((q) => ({
          question_text: stripHTML(q.question),
          answer: q.answer,
          difficulty: "Medium", // You can infer better if needed
        }));
        finalQuestions = [...finalQuestions, ...fallbackQs];
      } catch (err) {
        console.warn("⚠️ Failed to parse fallback questions:", fallbackResult);
      }
    }

    setQuestions(finalQuestions);
    setMessage("✅ Worksheet created and loaded.");
  } catch (err) {
    console.error(err);
    setMessage("❌ Failed to generate worksheet.");
  } finally {
    setIsLoading(false);
  }
};

const handleAddToSet = async () => {
  if (!questions.length) {
    toast.error("❗ No questions to add.");
    return;
  }

  try {
    const db = getDatabase();
    const cleanedQuestions = questions.map((q) => {
      let optionsArray = [];

      // Handle different types of options
      if (Array.isArray(q.options)) {
        optionsArray = q.options.map((opt) => {
          if (typeof opt === "string") return { text: opt };
          if (typeof opt === "object" && opt.text) return { text: opt.text };
          return { text: String(opt ?? "") };
        });
      }

      return {
        question: q.question_text || "No question text",
        options: optionsArray,
        answer: q.answer || "N/A",
        difficulty: q.difficulty || "Easy",
      };
    });

    await push(ref(db, "worksheetQuestionSets"), {
      name: worksheetName || `Worksheet ${Date.now()}`,
      grade,
      topic,
      subTopic,
      createdAt: new Date().toISOString(),
      questions: cleanedQuestions,
    });

    toast.success("✅ Questions added successfully to set!");
  } catch (error) {
    console.error("❌ Failed to add to set", error);
    toast.error("❌ Failed to add questions to the set.");
  }
};


  return (
    <div className="worksheet-wrapper">
      <h2 className="title">📝 New Worksheet Details</h2>
      <p className="subtitle">Provide details to generate a new worksheet.</p>

      <div className="form-group">
        <label>Name of Worksheet</label>
        <input
          type="text"
          value={worksheetName}
          onChange={(e) => setWorksheetName(e.target.value)}
          placeholder="e.g., Fractions Practice - Week 1"
          className="input"
        />
      </div>

      <div className="form-group">
        <label>Child Phone Number (Optional)</label>
        <input
          type="text"
          value={childPhone}
          onChange={(e) => setChildPhone(e.target.value)}
          placeholder="e.g., 9876543210"
          className="input"
        />
      </div>

      <div className="form-group">
        <label>Grade (Mandatory)</label>
        <select
          className="input"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>{g}th Grade</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Topic (Optional)</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Division"
          className="input"
        />
      </div>

      <div className="form-group">
        <label>Sub-Topic (Optional)</label>
        <input
          type="text"
          value={subTopic}
          onChange={(e) => setSubTopic(e.target.value)}
          placeholder="e.g., Long Division"
          className="input"
        />
      </div>

      <button onClick={handleGenerate} disabled={isLoading} className="generate-btn">
        {isLoading ? <Spinner /> : "🎯 Generate Worksheet"}
      </button>

      {message && (
        <p className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
          {message}
        </p>
      )}

      {questions.length > 0 && (
        <div className="questions-list">
          <h3>📋 Generated Questions</h3>
          <ol>
            {questions.map((q, idx) => (
              <li key={idx} className="question-card">
                <p><strong>Q:</strong> {q.question_text || "No text"}</p>
                {q.options && (
                  <ul>
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
                <p><strong>Answer:</strong> {q.answer}</p>
                <p className="difficulty">{q.difficulty?.toUpperCase()}</p>
              </li>
            ))}
          </ol>

          <button
            className="addToSetButton"
            onClick={handleAddToSet}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#388E3C')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#1f5ab3ff')}
          >
            ➕ Add to Set
          </button>
        </div>
      )}
    </div>
  );
};

export default WorksheetGenSystem;
