import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "./firebase/FirebaseSetup";
import "./AdminStats.css";

const FilteredQuestions = ({ filter, questions, onClose }) => (
  <div className="filtered-questions-container" style={{ marginTop: "20px", padding: "15px", background: "#f0f0f0", borderRadius: "8px" }}>
    <h2>
      Showing Questions — {filter.type.toUpperCase()}:{" "}
      {filter.type === "topic"
        ? filter.value.split("__").join(" / ")
        : filter.value}
    </h2>
    <button onClick={onClose} style={{ marginBottom: "10px" }}>Close</button>
    {questions.length === 0 ? (
      <p>No questions found.</p>
    ) : (
      <ul>
        {questions.map((q, idx) => (
          <li
            key={idx}
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "10px",
            }}
          >
            <strong>Q:</strong> {q.question || "No question text provided"} <br />
            <strong>Grade:</strong> {q.grade || "N/A"} <br />
            <strong>Topic:</strong> {q.topic || "N/A"} <br />
            <strong>Subtopic:</strong> {q.subtopic || "N/A"} <br />
            <strong>Difficulty:</strong> {q.difficultyLevel || "Unknown"} <br />
            <strong>Type:</strong> {q.type || "Unknown"}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const AdminStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    grades: {},
    difficulties: {},
    types: {},
    topics: [],
  });

  const [filter, setFilter] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const dbRef = ref(database, "questions");
      const snapshot = await get(dbRef);
      const data = snapshot.val();
      if (!data) return;

      let totalQuestions = 0;
      const gradeStats = {};
      const difficultyStats = {};
      const typeStats = {};
      const topicStats = [];

      const normalizeDifficulty = (diff) => {
        if (!diff) return "Unknown";
        const val = diff.toString().trim().toUpperCase();
        if (["L1", "LEVEL 1"].includes(val)) return "L1";
        if (["L2", "LEVEL 2"].includes(val)) return "L2";
        if (["L3", "LEVEL 3"].includes(val)) return "L3";
        if (["BR", "BRAIN", "BRAIN ROUND"].includes(val)) return "BR";
        return "Unknown";
      };

      const normalizeType = (type) => {
        if (!type) return "Unknown";
        const val = type.toString().trim().toUpperCase();
        if (val.includes("MCQ")) return "MCQ";
        if (val.includes("FILL")) return "FILL_IN_THE_BLANKS";
        if (val.includes("TRIVIA")) return "TRIVIA";
        return "Unknown";
      };

      const normalizeGrade = (grade) => {
        if (!grade) return "Unknown";
        const g = grade.toString().trim().toUpperCase();
        if (g.match(/^G\d+$/)) return g;
        if (g.match(/^GRADE\s*(\d)$/)) return `G${g.split(" ")[1]}`;
        if (g.match(/^\d$/)) return `G${g}`;
        return "Unknown";
      };

      Object.values(data).forEach((question) => {
        totalQuestions++;

        const grade = normalizeGrade(question.grade);
        gradeStats[grade] = (gradeStats[grade] || 0) + 1;

        const difficulty = normalizeDifficulty(question.difficultyLevel);
        difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;

        const type = normalizeType(question.type);
        typeStats[type] = (typeStats[type] || 0) + 1;

        const topic = question.topic || "N/A";
        const subtopic = question.subtopic || "N/A";
        const key = `${topic}__${subtopic}`;
        const existing = topicStats.find((t) => t.key === key);
        if (existing) {
          existing.count++;
        } else {
          topicStats.push({ key, topic, subtopic, count: 1 });
        }
      });

      setStats({
        total: totalQuestions,
        grades: gradeStats,
        difficulties: difficultyStats,
        types: typeStats,
        topics: topicStats,
      });

      setAllQuestions(Object.values(data));
    };

    fetchData();
  }, []);

  const getFilteredQuestions = () => {
    if (!filter) return [];

    const normalizeGrade = (grade) => {
      if (!grade) return "UNKNOWN";
      const g = grade.toString().trim().toUpperCase();
      if (g.match(/^G\d+$/)) return g;
      if (g.match(/^GRADE\s*(\d)$/)) return `G${g.split(" ")[1]}`;
      if (g.match(/^\d$/)) return `G${g}`;
      return "UNKNOWN";
    };

    const normalizeDifficulty = (diff) => {
      if (!diff) return "UNKNOWN";
      const val = diff.toString().trim().toUpperCase();
      if (["L1", "LEVEL 1"].includes(val)) return "L1";
      if (["L2", "LEVEL 2"].includes(val)) return "L2";
      if (["L3", "LEVEL 3"].includes(val)) return "L3";
      if (["BR", "BRAIN", "BRAIN ROUND"].includes(val)) return "BR";
      return "UNKNOWN";
    };

    const normalizeType = (type) => {
      if (!type) return "UNKNOWN";
      const val = type.toString().trim().toUpperCase();
      if (val.includes("MCQ")) return "MCQ";
      if (val.includes("FILL")) return "FILL_IN_THE_BLANKS";
      if (val.includes("TRIVIA")) return "TRIVIA";
      return "UNKNOWN";
    };

    switch (filter.type) {
      case "grade":
        return allQuestions.filter(
          (q) =>
            normalizeGrade(q.grade) === filter.value
        );

      case "difficulty":
        return allQuestions.filter(
          (q) =>
            normalizeDifficulty(q.difficultyLevel) === filter.value
        );

      case "type":
        return allQuestions.filter(
          (q) =>
            normalizeType(q.type) === filter.value
        );

      case "topic":
        const [topic, subtopic] = filter.value.split("__");
        return allQuestions.filter(
          (q) =>
            (q.topic || "N/A") === topic && (q.subtopic || "N/A") === subtopic
        );

      default:
        return [];
    }
  };

  const filteredQuestions = getFilteredQuestions();

 return (
  <div className="admin-container">
    <h1>Total Questions Uploaded</h1>
    <div className="total-box">{stats.total}</div>

    {/* Grade Section */}
    <section>
      <h1>Questions by Grade</h1>
      <table>
        <thead>
          <tr>
            <th>Grade</th>
            <th>No. of Qs</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.grades).map(([grade, count]) => (
            <tr key={grade}>
              <td>{grade}</td>
              <td
                className="clickable"
                onClick={() => setFilter({ type: "grade", value: grade })}
              >
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Show filtered questions inline */}
      {filter?.type === "grade" && (
        <FilteredQuestions
          filter={filter}
          questions={filteredQuestions}
          onClose={() => setFilter(null)}
        />
      )}
    </section>

    {/* Difficulty Section */}
    <section>
      <h1>Questions by Difficulty Level</h1>
      <table>
        <thead>
          <tr>
            <th>Difficulty Level</th>
            <th>No. of Qs</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.difficulties).map(([level, count]) => (
            <tr key={level}>
              <td>{level}</td>
              <td
                className="clickable"
                onClick={() => setFilter({ type: "difficulty", value: level })}
              >
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Show filtered questions inline */}
      {filter?.type === "difficulty" && (
        <FilteredQuestions
          filter={filter}
          questions={filteredQuestions}
          onClose={() => setFilter(null)}
        />
      )}
    </section>

    {/* Type Section */}
    <section>
      <h1>Questions by Type</h1>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>No. of Qs</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.types).map(([type, count]) => (
            <tr key={type}>
              <td>{type}</td>
              <td
                className="clickable"
                onClick={() => setFilter({ type: "type", value: type })}
              >
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Show filtered questions inline */}
      {filter?.type === "type" && (
        <FilteredQuestions
          filter={filter}
          questions={filteredQuestions}
          onClose={() => setFilter(null)}
        />
      )}
    </section>

    {/* Topic Section */}
    <section>
      <h1>Questions by Topic & Subtopic</h1>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Subtopic</th>
            <th>No. of Qs</th>
          </tr>
        </thead>
        <tbody>
          {stats.topics.map(({ key, topic, subtopic, count }) => (
            <tr key={key}>
              <td>{topic}</td>
              <td>{subtopic}</td>
              <td
                className="clickable"
                onClick={() => setFilter({ type: "topic", value: key })}
              >
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Show filtered questions inline */}
      {filter?.type === "topic" && (
        <FilteredQuestions
          filter={filter}
          questions={filteredQuestions}
          onClose={() => setFilter(null)}
        />
      )}
    </section>
  </div>
);

};

export default AdminStats;
