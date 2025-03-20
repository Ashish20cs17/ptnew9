import React, { useEffect, useState } from "react";
import "./AttachedQuestions.css";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, set } from "firebase/database";
import { ToastContainer, toast } from "react-toastify";

const AttachedQuestion = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedSetName, setSelectedSetName] = useState("");
  const [error, setError] = useState(null);
  const [setNameError, setSetNameError] = useState("");

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
        let allFetchedQuestions = Object.keys(data).map((questionId) => ({
          id: questionId,
          ...data[questionId],
        }));

        allFetchedQuestions.reverse();
        setQuestions(allFetchedQuestions);
        setFilteredQuestions(allFetchedQuestions);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to fetch questions");
      }
    };

    fetchAllQuestions();
  }, []);

  const handleAddToSet = async (questionId) => {
    if (!selectedSetName.trim()) {
      setSetNameError("❌ Please enter a valid set name!");
      return;
    }

    setSetNameError("");

    try {
      // First get the current set data to determine the next order number
      const setRef = ref(database, `attachedQuestionSets/${selectedSetName}`);
      const snapshot = await get(setRef);
      
      let nextOrder = 0;
      
      if (snapshot.exists()) {
        const existingSet = snapshot.val();
        
        // Check if question already exists in the set
        const existingQuestion = Object.values(existingSet).find(item => 
          (typeof item === 'string' && item === questionId) ||
          (typeof item === 'object' && item.id === questionId)
        );
        
        if (existingQuestion) {
          toast.warning(`⚠️ This question is already in set: ${selectedSetName}`);
          return;
        }
        
        // Find the highest order value
        const orders = Object.values(existingSet)
          .map(item => typeof item === 'object' && item.order !== undefined ? item.order : -1)
          .filter(order => order !== -1);
          
        nextOrder = orders.length > 0 ? Math.max(...orders) + 1 : 0;
      }
      
      // Now add the question with order information
      const questionRef = ref(database, `attachedQuestionSets/${selectedSetName}/${questionId}`);
      await set(questionRef, {
        id: questionId,
        order: nextOrder,
        addedAt: Date.now()
      });

      toast.success(`✅ Question added to set: ${selectedSetName} at position ${nextOrder}`);
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
              
              {/* Show question image if available */}
              {q.questionImage && (
                <div>
                  <img
                    src={q.questionImage}
                    alt="Question Attachment"
                    style={{ maxWidth: "300px", marginTop: "10px" }}
                  />
                </div>
              )}

              {/* Show correct answer */}
              {q.correctAnswer && (
                <p>
                  <strong>Correct Answer:</strong> {q.correctAnswer.text}
                  {q.correctAnswer.image && (
                    <img
                      src={q.correctAnswer.image}
                      alt="Correct Answer"
                      style={{ maxWidth: "100px", marginLeft: "10px" }}
                    />
                  )}
                </p>
              )}

              {/* Button to attach question */}
              <div>
                <button className="addQuestionButton" onClick={() => handleAddToSet(q.id)}>
                  {selectedSetName ? `Add question to ${selectedSetName}` : "Add to Set"}
                </button>
                <ToastContainer />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AttachedQuestion;