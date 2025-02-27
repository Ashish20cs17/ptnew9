import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get } from "firebase/database";

const AllQuestionsSet = () => {
  const [questionSets, setQuestionSets] = useState({});
  const [selectedSet, setSelectedSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllSets = async () => {
      try {
        const setsRef = ref(database, "attachedQuestionSets"); // ✅ Corrected node name
        const snapshot = await get(setsRef);

        if (!snapshot.exists()) {
          setError("No question sets found!");
          return;
        }

        const data = snapshot.val();
        console.log("✅ Fetched Question Sets:", data); // Debugging Log
        setQuestionSets(data);
      } catch (err) {
        console.error("❌ Error fetching question sets:", err);
        setError("Failed to fetch question sets");
      }
    };

    fetchAllSets();
  }, []);

  // ✅ Fetch questions using IDs from the selected set
  const handleSetClick = async (setName) => {
    setSelectedSet(setName);
    setQuestions([]);
    setLoading(true);

    try {
      const setQuestions = questionSets[setName]; // ✅ Get question IDs inside the set
      if (!setQuestions) {
        setError("No questions found in this set.");
        setLoading(false);
        return;
      }

      console.log(`📌 Fetching questions for set: ${setName}`, setQuestions); // Debugging Log

      const fetchedQuestions = [];

      for (const questionId of Object.values(setQuestions)) {
        console.log(`🔍 Fetching question ID: ${questionId}`); // Debugging Log

        const questionRef = ref(database, `questions/${questionId}`);
        const questionSnapshot = await get(questionRef);

        if (questionSnapshot.exists()) {
          fetchedQuestions.push({
            id: questionId,
            ...questionSnapshot.val(),
          });
        } else {
          console.warn(`⚠️ Question ID ${questionId} not found in "questions" node.`);
        }
      }

      console.log("✅ Successfully fetched questions:", fetchedQuestions); // Debugging Log
      console.log("🔹 Before setting state:", questions);
      setQuestions(fetchedQuestions);
      console.log("✅ After setting state:", fetchedQuestions);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching questions:", err);
      setError("Failed to load questions.");
      setLoading(false);
    }
  };

  return (
    <div className="allQuestionsContainer">
      <h2>All Question Sets</h2>
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ✅ Show all sets */}
      {!selectedSet ? (
        <div className="questionSetsList">
          {Object.keys(questionSets).length > 0 ? (
            <ul>
              {Object.keys(questionSets).map((setName) => (
                <li
                  key={setName}
                  onClick={() => handleSetClick(setName)}
                  style={{ cursor: "pointer", color: "blue" }}
                >
                  {setName}
                </li>
              ))}
            </ul>
          ) : (
            <p>No sets available.</p>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedSet(null)}>🔙 Back to Sets</button>
          <h3>Questions in "{selectedSet}"</h3>

          {loading ? <p>Loading questions...</p> : null}

          <ul>
            {questions.length > 0 ? (
              questions.map((q) => (
                <li key={q.id}>
                  <strong>{q.question}</strong> ({q.type})
                  {q.imageUrl && (
                    <div>
                      <img
                        src={q.imageUrl}
                        alt="Question Attachment"
                        style={{ maxWidth: "300px", marginTop: "10px" }}
                      />
                    </div>
                  )}
                  {q.type === "MCQ" && q.options && (
                    <ul>
                      {q.options.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                  )}
                  {q.correctAnswer && <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>}
                  {q.type === "Fill in the Blanks" && <p>Answer: {q.answer}</p>}
                </li>
              ))
            ) : (
              !loading && <p>No questions found in this set.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AllQuestionsSet;
