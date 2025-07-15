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

  const generateWorksheetFromGemini = async (prompt) => {
    const res = await fetch("http://localhost:5000/generate-worksheet", {
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
      const db = getDatabase();
      const quizRef = ref(db, `quizResults/${childPhone}`);
      const snapshot = await get(quizRef);

      let prompt = "";

      if (snapshot.exists()) {
        const quizData = snapshot.val();
        const latest = Object.values(quizData).sort(
          (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
        )[0];

        prompt = `Generate a worksheet for a ${grade}th grader using history:
Score: ${latest.score}%, Correct: ${latest.correctAnswers},
Set: ${latest.selectedSet}, Topic: ${topic || "Any"}, SubTopic: ${subTopic || "Any"}.
Return raw JSON ONLY in this format:
{
  "sections": [
    { "difficulty": "Easy", "questions": [ {"question_text": "...", "options": ["..."], "answer": "..."} ] },
    { "difficulty": "Medium", "questions": [...] },
    { "difficulty": "Hard", "questions": [...] }
  ]
}`;
      } else {
        const split = Math.floor(8 / (selectedLevels.length || 3));
        prompt = `Generate a worksheet for grade ${grade}.
Topic: ${topic || "Any"}, Subtopic: ${subTopic || "Any"}.
Include ${split} questions for each level: ${selectedLevels.join(", ") || "Easy, Medium, Hard"}.
Return raw JSON ONLY like this:
{
  "sections": [
    { "difficulty": "Easy", "questions": [ {"question_text": "...", "options": ["..."], "answer": "..."} ] },
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
        sec.questions.map((q) => ({ ...q, difficulty: sec.difficulty }))
      );

      setQuestions(flatQuestions);
      setMessage("✅ Worksheet created and loaded.");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to generate worksheet.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Add to Set function — Push to "worksheetQuestionSets"
 const handleAddToSet = async () => {
  if (!questions.length) {
    toast.error("❗ No questions to add.");
    return;
  }

  try {
    const db = getDatabase();
    await push(ref(db, "worksheetQuestionSets"), {
      name: worksheetName || `Worksheet ${Date.now()}`,
      grade,
      topic,
      subTopic,
      createdAt: new Date().toISOString(),
      questions: questions.map((q) => ({
        question: q.question_text,
        options: q.options?.map((opt) => ({ text: opt })),
        answer: q.answer,
        difficulty: q.difficulty,
      })),
    });

    toast.success("✅ Questions added successfully to set!");
    setMessage(""); // optional: clear old message
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

      <div className="form-group">
        <label>Difficulty Levels (Optional)</label>
        <p className="helper-text">
          If none selected, a mix will be generated. If multiple, questions are split evenly.
        </p>
        <div className="checkbox-group">
          {levels.map((lvl) => (
            <label key={lvl} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedLevels.includes(lvl)}
                onChange={() => toggleLevel(lvl)}
              />
              {lvl}
            </label>
          ))}
        </div>
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
