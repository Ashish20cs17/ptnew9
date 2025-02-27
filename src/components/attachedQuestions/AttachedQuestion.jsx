import React, { useEffect, useState } from "react";
import "./AttachedQuestions.css";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, push } from "firebase/database";

const AttachedQuestion = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedSetName, setSelectedSetName] = useState(""); // Stores input field value
  const [error, setError] = useState(null);
  const [setNameError, setSetNameError] = useState(""); // Error for empty set name

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

        // ✅ Fetch questions properly (without looping over dates)
        Object.keys(data).forEach((questionId) => {
          allFetchedQuestions.push({
            id: questionId,
            ...data[questionId],
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

  // ✅ Function to add question ID to Firebase under the selected set name
  const handleAddToSet = async (question) => {
    if (!selectedSetName.trim()) {
      setSetNameError("❌ Please enter a valid set name!");
      return;
    }

    setSetNameError(""); // Clear error if valid

    const { id } = question;

    try {
      // ✅ Store question ID inside the selected set (without using today's date)
      const setRef = ref(database, `attachedQuestionSets/${selectedSetName}`);
      await push(setRef, id);

      console.log(`✅ Question ${id} added to set: ${selectedSetName}`);
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
        value={selectedSetName}
        onChange={(e) => setSelectedSetName(e.target.value)}
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
              <strong>{q.question}</strong> ({q.type})

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
                {selectedSetName ? `Add question to ${selectedSetName}` : "Add to Set"}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AttachedQuestion;
