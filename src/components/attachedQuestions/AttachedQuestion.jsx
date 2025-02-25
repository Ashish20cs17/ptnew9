import React, { useEffect, useState } from 'react';
import "./AttachedQuestions.css";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, push } from "firebase/database";

const AttachedQuestion = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(""); // Stores input field value
  const [error, setError] = useState(null);
  const [setNameError, setSetNameError] = useState(""); // Error for empty set name

  // ✅ Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Formats as YYYY-MM-DD
  };

  useEffect(() => {
    const fetchAllQuestions = async () => {
      try {
        const questionsRef = ref(database, "questions");
        const snapshot = await get(questionsRef);

        if (!snapshot.exists()) {
          setError("No questions found!");
          return;
        }

        const data = snapshot.val();
        let allFetchedQuestions = [];

        Object.keys(data).forEach((date) => {
          Object.keys(data[date]).forEach((questionId) => {
            allFetchedQuestions.push({
              id: questionId,
              date,
              ...data[date][questionId],
            });
          });
        });

        allFetchedQuestions.reverse(); // Show latest questions first

        setQuestions(allFetchedQuestions);
        setFilteredQuestions(allFetchedQuestions);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to fetch questions");
      }
    };

    fetchAllQuestions();
  }, []);

  // ✅ Function to add question ID to Firebase under today's date
  const handleAddToSet = async (question) => {
    if (!selectedQuestion.trim()) {
      setSetNameError("❌ Please enter a valid set name!");
      return;
    }

    setSetNameError(""); // Clear error if valid

    const todayDate = getTodayDate(); // Get today's date
    const { id } = question;

    try {
      const setRef = ref(database, `attachedQuestionSets/${todayDate}/${selectedQuestion}`);
      await push(setRef, id); // Store question ID inside set

      console.log(`✅ Question ${id} added to set: ${selectedQuestion} (Date: ${todayDate})`);
    } catch (err) {
      console.error("❌ Error adding question to set:", err);
      setError("Failed to attach question to set.");
    }
  };

  return (
    <div className="attachedQuestionsContainer">
      <h2>All Questions</h2>
      <hr />

      {/* Input field for set name */}
      <input
        type="text"
        value={selectedQuestion}
        onChange={(e) => setSelectedQuestion(e.target.value)}
        placeholder="Enter set name"
      />
      {setNameError && <p style={{ color: "red" }}>{setNameError}</p>}
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      {/* Scrollable Questions List */}
      <div className="attachedQuestionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="attachedQuestionItem">
              <strong>{q.question}</strong> ({q.type}) - <small>{q.date}</small>

              {/* Show image if available */}
              {q.imageUrl && (
                <div>
                  <img
                    src={q.imageUrl}
                    alt="Question Attachment"
                    style={{ maxWidth: "300px", marginTop: "10px" }}
                  />
                </div>
              )}

              {/* ✅ Button with dynamic text */}
              <button className="addQuestionButton" onClick={() => handleAddToSet(q)}>
                {selectedQuestion ? `Add question to ${selectedQuestion}` : "Add to"}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AttachedQuestion;
