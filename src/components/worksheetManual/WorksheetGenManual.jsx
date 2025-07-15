import React, { useEffect, useState, useRef } from "react";
import { getDatabase, ref, get, remove } from "firebase/database";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const WorksheetGenManual = () => {
  const [sets, setSets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSet, setSelectedSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const pdfContentRef = useRef(null);

  // ✅ Fetch sets from worksheetQuestionSets
  useEffect(() => {
    const db = getDatabase();
    const worksheetRef = ref(db, "worksheetQuestionSets");

    setLoading(true);
    get(worksheetRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const entries = Object.entries(data); // [ [id, data], ... ]
          setSets(entries);
        } else {
          setSets([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("❌ Failed to load worksheet sets");
        setLoading(false);
      });
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredSets = sets.filter(([, data]) =>
    (data.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSetClick = (setId, setData) => {
    setSelectedSet(setId);
    setQuestions(setData.questions || []);
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
    setQuestions([]);
  };

  const deleteQuestionSet = async (setId) => {
    if (!window.confirm(`Are you sure you want to delete the set "${setId}"?`)) return;

    setDeleteLoading(true);
    const db = getDatabase();
    const setRef = ref(db, `worksheetQuestionSets/${setId}`);
    try {
      await remove(setRef);
      setSets((prev) => prev.filter(([id]) => id !== setId));
      if (selectedSet === setId) {
        setSelectedSet(null);
        setQuestions([]);
      }
      toast.success("✅ Set deleted successfully!");
    } catch (err) {
      console.error(err);
      setError("❌ Failed to delete set");
    }
    setDeleteLoading(false);
  };

  return (
    <div className="worksheet-wrapper">
      <h2 className="title">📘 Gemini-Generated Worksheet Sets</h2>

      {error && <p className="errorMessage">{error}</p>}

      {!selectedSet ? (
        <div className="questionSetsList">
          <h3>📚 Available Worksheet Sets</h3>
          <input
            type="text"
            placeholder="Search worksheet sets..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="searchInput"
          />

          {loading ? (
            <p>Loading sets...</p>
          ) : filteredSets.length > 0 ? (
            <ul className="setsList">
              {filteredSets.map(([setId, setData]) => (
                <li key={setId} className="setItem">
                  <div
                    className="setName"
                    onClick={() => handleSetClick(setId, setData)}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                  >
                    {setData.name || setId} ({setData?.questions?.length || 0} questions)
                  </div>
                  <button
                    className="deleteButton"
                    onClick={() => deleteQuestionSet(setId)}
                    disabled={deleteLoading}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No sets found.</p>
          )}
        </div>
      ) : (
        <div className="selectedSetView">
          <div className="setHeader">
            <button onClick={handleBackToSets} className="backButton">
              🔙 Back
            </button>
            <h3>Questions in "{selectedSet}"</h3>
          </div>

          {questions.length > 0 ? (
            <ol className="questionsList" ref={pdfContentRef}>
              {questions.map((q, idx) => (
                <li key={idx} className="question-card">
                  <p>
                    <strong>Q:</strong> {q.question || q.question_text || "No text"}
                  </p>
                  {q.options && (
                    <ul>
                      {q.options.map((opt, i) => (
                        <li key={i}>{typeof opt === "string" ? opt : opt.text}</li>
                      ))}
                    </ul>
                  )}
                  <p>
                    <strong>Answer:</strong> {q.answer}
                  </p>
                  <p className="difficulty">{q.difficulty?.toUpperCase()}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p>No questions in this set.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorksheetGenManual;
