import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import "./AllQuestions.css";

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter states
  const [grade, setGrade] = useState("all");
  const [topic, setTopic] = useState("all");
  const [topicList, setTopicList] = useState("all");
  const [difficultyLevel, setDifficultyLevel] = useState("all");

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

  // Apply filters when any filter value changes
  useEffect(() => {
    let result = [...questions];

    // Apply grade filter
    if (grade !== "all") {
      result = result.filter(q => q.grade === grade);
    }

    // Apply topic filter
    if (topic !== "all") {
      result = result.filter(q => q.topic === topic);
    }

    // Apply topicList (subtopic) filter
    if (topicList !== "all") {
      result = result.filter(q => q.topicList === topicList);
    }

    // Apply difficulty filter
    if (difficultyLevel !== "all") {
      result = result.filter(q => q.difficultyLevel === difficultyLevel);
    }

    setFilteredQuestions(result);
  }, [questions, grade, topic, topicList, difficultyLevel]);

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

  // Generate list of unique values for each filter
  const getUniqueValues = (field) => {
    if (questions.length === 0) return [];
    
    const uniqueValues = [...new Set(questions.map(q => q[field]).filter(Boolean))];
    return uniqueValues.sort();
  };

  // Get subtopics based on selected grade and topic
  const getFilteredTopicList = () => {
    if (grade === "all" || topic === "all") return getUniqueValues("topicList");
    
    const filteredValues = questions
      .filter(q => q.grade === grade && q.topic === topic)
      .map(q => q.topicList)
      .filter(Boolean);
    
    return [...new Set(filteredValues)].sort();
  };

  return (
    <div className="allQuestionContainer">
      <h2>All Questions</h2>
      <hr />

      {/* Filter Controls */}
      <div className="filterControls">
        <div className="formGroup">
          <label>Grade:</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="all">All Grades</option>
            <option value="G1">Grade 1</option>
            <option value="G2">Grade 2</option>
            <option value="G3">Grade 3</option>
            <option value="G4">Grade 4</option>
          </select>
        </div>

        <div className="formGroup">
          <label>Topic:</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">All Topics</option>
            <option value="Number System">Number System</option>
            <option value="Operations">Operations</option>
            <option value="Shapes and Geometry">Shapes and Geometry</option>
            <option value="Measurement">Measurement</option>
            <option value="Data Handling">Data Handling</option>
            <option value="Maths Puzzles">Maths Puzzles</option>
            <option value="Real Life all concept sums">Real Life all concept sums</option>
          </select>
        </div>

        <div className="formGroup">
          <label>Subtopic:</label>
          <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
            <option value="all">All Subtopics</option>
            {getFilteredTopicList().map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label>Difficulty:</label>
          <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
            <option value="all">All Difficulty Levels</option>
            {getUniqueValues("difficultyLevel").map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      {/* Question count info */}
      <div className="questionStats">
        <p>Showing {filteredQuestions.length} of {questions.length} questions</p>
      </div>

      <div className="questionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="questionItem">
              <strong>{q.question}</strong> ({q.type}) 
              <small> - {q.timestamp ? new Date(q.timestamp).toLocaleString() : "No Time"}</small>
              
              {/* Display grade, topic, and subtopic if available */}
              <div className="questionMeta">
                {q.grade && <span className="tag">Grade: {q.grade}</span>}
                {q.topic && <span className="tag">Topic: {q.topic}</span>}
                {q.topicList && <span className="tag">Subtopic: {q.topicList}</span>}
                {q.difficultyLevel && <span className="tag">Difficulty: {q.difficultyLevel}</span>}
              </div>

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