import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get } from "firebase/database";

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState(null);

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

        setQuestions(allFetchedQuestions);
        setFilteredQuestions(allFetchedQuestions); // Show all questions initially
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to fetch questions");
      }
    };

    fetchAllQuestions();
  }, []);

  // Function to filter questions based on the selected date
  const handleDateChange = (e) => {
    const selectedDateValue = e.target.value;
    setSelectedDate(selectedDateValue);

    if (selectedDateValue === "") {
      setFilteredQuestions(questions); // Show all if date is cleared
    } else {
      const filtered = questions.filter((q) => q.date === selectedDateValue);
      setFilteredQuestions(filtered);
    }
  };

  return (
    <div className="loginContainer">
      <h2>All Questions</h2>
      <hr />

      {/* Date Picker to filter questions */}
      <input
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
      />
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      <ol>
        
        {filteredQuestions.map((q) => (
          <li key={q.id}>
            <strong>{q.question}</strong> ({q.type}) - <small>{q.date}</small>
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
