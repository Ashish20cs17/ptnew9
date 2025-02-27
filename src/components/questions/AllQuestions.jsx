import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";

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

        // ✅ Fetch questions directly by their IDs (no date nodes)
        Object.keys(data).forEach((questionId) => {
          allFetchedQuestions.push({
            id: questionId,
            ...data[questionId], // Spread question data
          });
        });

        // Reverse to show latest first
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

  // ✅ Convert timestamp to readable time
  const convertTimestampToTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // AM/PM format
    });
  };

  // ✅ Delete question
  const handleDelete = async (question) => {
    const { id, imageUrl } = question;

    // ✅ Extract file path from Supabase URL
    const filePath = imageUrl?.replace(
      "https://couvdshedcmsvofxouuz.supabase.co/storage/v1/object/public/questions/",
      ""
    );

    // ✅ Delete image from Supabase
    if (filePath) {
      try {
        const { error } = await supabase.storage.from("questions").remove([filePath]);
        if (error) {
          console.error("❌ Error deleting image from Supabase:", error);
        } else {
          console.log("✅ Image deleted from Supabase:", filePath);
        }
      } catch (err) {
        console.error("❌ Failed to delete image from Supabase:", err);
      }
    }

    // ✅ Delete from Firebase
    try {
      await remove(ref(database, `questions/${id}`));

      // Update UI after deletion
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setFilteredQuestions((prev) => prev.filter((q) => q.id !== id));

      console.log("✅ Question deleted successfully from Firebase.");
    } catch (err) {
      console.error("❌ Error deleting question from Firebase:", err);
      setError("Failed to delete question");
    }
  };

  return (
    <div className="allQuestionsContainer">
      <h2>All Questions</h2>
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      {/* Scrollable Questions List */}
      <div className="questionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="questionItem">
              <strong>{q.question}</strong> ({q.type}) 
              <small> - {q.timestamp ? convertTimestampToTime(q.timestamp) : "No Time"}</small>

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

              {/* ✅ Delete button */}
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
