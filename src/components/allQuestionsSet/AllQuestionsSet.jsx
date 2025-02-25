import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get } from "firebase/database";

const AllQuestionsSet = () => {
  const [questionSets, setQuestionSets] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSet, setSelectedSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllSets = async () => {
      try {
        const setsRef = ref(database, "attachedQuestionSets");
        const snapshot = await get(setsRef);

        if (!snapshot.exists()) {
          setError("No question sets found!");
          return;
        }

        setQuestionSets(snapshot.val());
      } catch (err) {
        console.error("Error fetching question sets:", err);
        setError("Failed to fetch question sets");
      }
    };

    fetchAllSets();
  }, []);

  // ✅ Handle date selection
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSet(null); // Reset selected set when date changes
    setQuestions([]); // Clear questions list
  };

  // ✅ Fetch actual questions dynamically using the correct date
  const handleSetClick = async (setName) => {
    setSelectedSet(setName);
    setQuestions([]); // Clear old questions before fetching new ones

    try {
      const setQuestions = questionSets[selectedDate]?.[setName];
      if (!setQuestions) return;

      const fetchedQuestions = [];

      // ✅ Step 1: Search for the correct date for each question ID
      for (const questionId of Object.values(setQuestions)) {
        const questionsRef = ref(database, "questions");
        const questionsSnapshot = await get(questionsRef);

        if (questionsSnapshot.exists()) {
          const allDates = questionsSnapshot.val();

          let correctDate = null;
          let questionData = null;

          // ✅ Search through all dates to find the actual question
          for (const date in allDates) {
            if (allDates[date][questionId]) {
              correctDate = date;
              questionData = allDates[date][questionId];
              break; // Stop searching once found
            }
          }

          if (questionData) {
            fetchedQuestions.push({
              id: questionId,
              date: correctDate, // ✅ Store the actual question date
              ...questionData,
            });
          }
        }
      }

      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions.");
    }
  };

  return (
    <div className="allQuestionsContainer">
      <h2>All Question Sets</h2>
      <hr />

      {/* Date Picker to filter question sets */}
      <input type="date" value={selectedDate} onChange={handleDateChange} />
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Show list of question sets for the selected date */}
      {!selectedSet ? (
        <div className="questionSetsList">
          {selectedDate ? (
            questionSets[selectedDate] ? (
              <ul>
                {Object.keys(questionSets[selectedDate]).map((setName) => (
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
              <p>No sets found for the selected date.</p>
            )
          ) : (
            <ul>
              {Object.keys(questionSets).map((date) => (
                <li key={date}>
                  <strong>{date}</strong>
                  <ul>
                    {Object.keys(questionSets[date]).map((setName) => (
                      <li
                        key={setName}
                        onClick={() => {
                          setSelectedDate(date);
                          handleSetClick(setName);
                        }}
                        style={{ cursor: "pointer", color: "blue" }}
                      >
                        {setName}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedSet(null)}>🔙 Back to Sets</button>
          <h3>Questions in "{selectedSet}" ({selectedDate})</h3>
          <ul>
            {questions.length > 0 ? (
              questions.map((q) => (
                <li key={q.id}>
                  <strong>{q.question}</strong> ({q.type}) - <small>Actual Date: {q.date}</small>
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
              <p>Loading questions...</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AllQuestionsSet;
