import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove } from "firebase/database";
import  supabase  from "../supabase/SupabaseConfig";

import "./AllQuestions.css";

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

        // Reverse the order so latest questions appear first
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

  // Function to filter questions based on the selected date
  const handleDateChange = (e) => {
    const selectedDateValue = e.target.value;
    setSelectedDate(selectedDateValue);

    if (selectedDateValue === "") {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter((q) => q.date === selectedDateValue);
      setFilteredQuestions(filtered);
    }
  };

  // ✅ **Fixed handleDelete function**
  const handleDelete = async (question) => {
    const { id, date, imageUrl } = question;

    // 1️⃣ **Delete image from Supabase if it exists**
    if (imageUrl) {
      try {
        // Extract file name from URL
        const urlParts = imageUrl.split("/");
        const fileName = urlParts[urlParts.length - 1]; // Get last part as file name

        // Delete the specific image from Supabase Storage
        const { error } = await supabase.storage
          .from("questions") // Change this to your Supabase bucket name
          .remove([fileName]);

        if (error) {
          console.error("Error deleting image from Supabase:", error);
        } else {
          console.log("Image deleted from Supabase:", fileName);
        }
      } catch (err) {
        console.error("Failed to delete image from Supabase:", err);
      }
    }

    // 2️⃣ **Delete the question from Firebase**
    try {
      await remove(ref(database, `questions/${date}/${id}`));

      // Update UI after deletion
      setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
      setFilteredQuestions((prevFiltered) => prevFiltered.filter((q) => q.id !== id));

      console.log("Question deleted successfully from Firebase.");
    } catch (err) {
      console.error("Error deleting question from Firebase:", err);
      setError("Failed to delete question");
    }
  };

  return (
    <div className="allQuestionsContainer">
      <h2>All Questions</h2>
      <hr />

      {/* Date Picker to filter questions */}
      <input type="date" value={selectedDate} onChange={handleDateChange} />
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      {/* Scrollable Questions List */}
      <div className="questionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="questionItem">
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

              {/* Show MCQ options properly */}
              {q.type === "MCQ" && Array.isArray(q.options) && (
                <ul>
                  {q.options.map((option, index) => (
                    <li key={index}>{option}</li>
                  ))}
                </ul>
              )}

              {/* Show the correct answer if available */}
              {q.correctAnswer && <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>}

              {q.type === "Fill in the Blanks" && <p>Answer: {q.answer}</p>}

              {/* ✅ Delete button - Now correctly passes the question object */}
              <button className="deleteButton" onClick={() => handleDelete(q)}>
                Delete
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AllQuestions;
