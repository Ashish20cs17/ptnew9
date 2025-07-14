import React, { useState } from "react";
import { getDatabase, ref, push, get } from "firebase/database";
import { generateWorksheetFromGemini } from "../../services/geminiService";
import Spinner from "../Spinner";

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

  const toggleLevel = (level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setMessage("");

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

        prompt = `Create a worksheet for a ${grade}th grader using this history:
Score: ${latest.score}%, Correct: ${latest.correctAnswers},
Set: ${latest.selectedSet}, Topic: ${topic || "Any"}, SubTopic: ${subTopic || "Any"}.
Generate 8 MCQs in JSON format with 4 options and 1 correct answer.`;
      } else {
        if (selectedLevels.length === 0) {
          prompt = `Generate a worksheet for ${grade}th grade.
Topic: ${topic || "Any"}, SubTopic: ${subTopic || "Any"}
Include 4 easy, 2 medium, 2 hard level MCQs in JSON.`;
        } else {
          const split = Math.floor(8 / selectedLevels.length);
          prompt = `Generate a worksheet for grade ${grade} on topic ${topic || "General"} and subtopic ${subTopic || "Any"}.
Include ${split} questions each of levels: ${selectedLevels.join(", ")} in JSON.`;
        }
      }

      const response = await generateWorksheetFromGemini(prompt);
      const parsed = JSON.parse(response);

      await push(ref(db, "manualWorksheets"), {
        name: worksheetName,
        grade,
        topic,
        subTopic,
        createdAt: new Date().toISOString(),
        questions: parsed.questions || [],
      });

      setMessage("✅ Worksheet created and saved.");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to generate worksheet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-6 bg-white border rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Worksheet Generator</h2>

      <div className="grid grid-cols-1 gap-4">
        <input
          type="text"
          value={worksheetName}
          onChange={(e) => setWorksheetName(e.target.value)}
          className="p-2 border rounded"
          placeholder="Worksheet Name"
        />
        <input
          type="text"
          value={childPhone}
          onChange={(e) => setChildPhone(e.target.value)}
          className="p-2 border rounded"
          placeholder="Child Phone Number (Optional)"
        />
        <input
          type="text"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="p-2 border rounded"
          placeholder="Grade (e.g. 3)"
        />
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="p-2 border rounded"
          placeholder="Topic (optional)"
        />
        <input
          type="text"
          value={subTopic}
          onChange={(e) => setSubTopic(e.target.value)}
          className="p-2 border rounded"
          placeholder="SubTopic (optional)"
        />
      </div>

      <div className="mt-4">
        <p className="font-semibold mb-2">Difficulty Levels (optional):</p>
        <div className="flex flex-wrap gap-4">
          {levels.map((lvl) => (
            <label key={lvl} className="flex items-center gap-2">
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

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        {isLoading ? <Spinner /> : "Generate Worksheet"}
      </button>

      {message && (
        <p
          className={`mt-4 p-3 text-sm rounded ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default WorksheetGenSystem;
