import React, { useEffect, useState } from "react";
import { db } from "../firebase/FirebaseSetup";
import { collection, getDocs } from "firebase/firestore";

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
        const questionsRef = collection(db, `questions/${today}/allQuestions`);
        const snapshot = await getDocs(questionsRef);

        if (snapshot.empty) {
          setQuestions([]);
          setError("No questions available!");
          return;
        }

        const fetchedQuestions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setQuestions(fetchedQuestions);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to fetch questions");
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div className="loginContainer">
          
          
      <h2>All Questions</h2>
      <hr />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {questions.length === 0 && !error ? <p>Loading...</p> : null}
      <ol>
        {questions.map((q) => (
          <li key={q.id}>
            <strong>{q.question}</strong> ({q.type})
            {q.type === "MCQ" && (
              <ul>
                <li>{q.option1}</li>
                <li>{q.option2}</li>
                <li>{q.option3}</li>
                <li>{q.option4}</li>
              </ul>
            )}
            {q.type === "Fill in the Blanks" && <p>Answer: {q.answer}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default AllQuestions;
