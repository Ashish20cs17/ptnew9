import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import "./AllQuestions.css";

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
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
        let allFetchedQuestions = Object.keys(data).map((questionId) => ({
          id: questionId,
          ...data[questionId], // Spread question data
        }));

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

  const deleteImageFromSupabase = async (url) => {
    if (!url) return;

    const filePath = url.replace(
      "https://couvdshedcmsvofxouuz.supabase.co/storage/v1/object/public/questions/",
      ""
    );

    try {
      const { error } = await supabase.storage.from("questions").remove([filePath]);
      if (error) console.error("Error deleting image from Supabase:", error);
    } catch (err) {
      console.error("Failed to delete image from Supabase:", err);
    }
  };

  const handleDelete = async (question) => {
    const { id, questionImage, options, correctAnswer } = question;

    // Delete all images associated with the question
    await deleteImageFromSupabase(questionImage);
    if (options) {
      for (const option of options) {
        await deleteImageFromSupabase(option.image);
      }
    }
    await deleteImageFromSupabase(correctAnswer?.image);

    // Delete from Firebase
    try {
      await remove(ref(database, `questions/${id}`));
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setFilteredQuestions((prev) => prev.filter((q) => q.id !== id));
      console.log("✅ Question deleted successfully from Firebase.");
    } catch (err) {
      console.error("❌ Error deleting question from Firebase:", err);
      setError("Failed to delete question");
    }
  };

  return (
    <div className="allQuestionContainer">
      <h2>All Questions</h2>
      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      <div className="questionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="questionItem">
              <strong>{q.question}</strong> ({q.type}) 
              <small> - {q.timestamp ? new Date(q.timestamp).toLocaleString() : "No Time"}</small>

              {/* Show question image if available */}
              {q.questionImage && (
                <div>
                  <img
                    src={q.questionImage}
                    alt="Question"
                    style={{ maxWidth: "300px", marginTop: "10px" }}
                  />
                </div>
              )}

              {/* Show MCQ options properly */}
              {q.type === "MCQ" && Array.isArray(q.options) && (
                <ul>
                  {q.options.map((option, index) => (
                    <li key={index}>
                      {option.text}
                      {option.image && (
                        <img
                          src={option.image}
                          alt={`Option ${index + 1}`}
                          style={{ maxWidth: "100px", marginLeft: "10px" }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
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

              {/* Show answer for Fill in the Blanks */}
              {q.type === "FILL_IN_THE_BLANKS" && <p>Answer: {q.correctAnswer.text}</p>}

              {/* Delete button */}
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
