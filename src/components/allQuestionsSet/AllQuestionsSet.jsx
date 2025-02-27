import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, set } from "firebase/database";
import { ToastContainer, toast } from "react-toastify";

const AllQuestionsSet = () => {
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  useEffect(() => {
    const fetchQuestionSets = async () => {
      try {
        const setsRef = ref(database, "attachedQuestionSets");
        const snapshot = await get(setsRef);

        if (!snapshot.exists()) {
          setError("No question sets found!");
          return;
        }

        setQuestionSets(Object.entries(snapshot.val()));
      } catch (err) {
        console.error("❌ Error fetching question sets:", err);
        setError("Failed to fetch question sets.");
      }
    };

    fetchQuestionSets();
  }, []);

  const handleSetClick = async (setName, setQuestionsData) => {
    setSelectedSet(setName);
    setQuestions([]);
    setLoading(true);
    setError(null);

    try {
      const questionIds = Object.values(setQuestionsData);
      const fetchedQuestions = [];
      const questionPromises = questionIds.map(async (questionId) => {
        const questionRef = ref(database, `questions/${questionId}`);
        const questionSnapshot = await get(questionRef);
        return questionSnapshot.exists()
          ? { id: questionId, ...questionSnapshot.val() }
          : null;
      });

      const results = await Promise.all(questionPromises);
      setQuestions(results.filter(Boolean));
    } catch (err) {
      console.error("❌ Error fetching questions:", err);
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachToUser = async () => {
    if (!userEmail.trim()) {
      toast.error("❌ Please enter a valid email!");
      return;
    }

    try {
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        toast.error("❌ No users found in the database!");
        return;
      }

      const users = snapshot.val();
      const userKey = Object.keys(users).find(
        (key) => users[key].email === userEmail.trim()
      );

      if (!userKey) {
        toast.error("❌ User not found!");
        return;
      }

      const userSetsRef = ref(database, `users/${userKey}/assignedSets/${selectedSet}`);
      await set(userSetsRef, questions.map(q => q.id));
      toast.success(`✅ Set "${selectedSet}" attached to ${userEmail}`);
    } catch (err) {
      console.error("❌ Error attaching set to user:", err);
      toast.error("❌ Failed to attach set.");
    }
  };

  return (
    <div className="allQuestionsContainer">
      <h2>All Question Sets</h2>
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!selectedSet ? (
        <div className="questionSetsList">
          {questionSets.length > 0 ? (
            <ul>
              {questionSets.map(([setName, setQuestionsData]) => (
                <li
                  key={setName}
                  onClick={() => handleSetClick(setName, setQuestionsData)}
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

                  {q.questionImage && (
                    <div>
                      <img
                        src={q.questionImage}
                        alt="Question Attachment"
                        style={{ maxWidth: "300px", marginTop: "10px" }}
                      />
                    </div>
                  )}

                  {q.correctAnswer && (
                    <p>
                      <strong>Correct Answer:</strong> {q.correctAnswer.text}
                    </p>
                  )}

                  {q.type === "Fill in the Blanks" && q.answer && (
                    <p>
                      <strong>Answer:</strong> {q.answer}
                    </p>
                  )}
                </li>
              ))
            ) : (
              !loading && <p>No questions found in this set.</p>
            )}
          </ul>
          <hr />
          <h3>Attach this Set to a User</h3>
          <input
            type="email"
            placeholder="Enter user email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <button onClick={handleAttachToUser}>Attach Set</button>
          <ToastContainer />
        </div>
      )}
    </div>
  );
};

export default AllQuestionsSet;
