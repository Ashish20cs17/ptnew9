import React, { useEffect, useState } from "react";
import "./AttachedQuestions.css";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, set } from "firebase/database";
import { ToastContainer, toast } from "react-toastify";
import parse from "html-react-parser"; // Import html-react-parser

const AttachedQuestion = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedSetName, setSelectedSetName] = useState("");
  const [error, setError] = useState(null);
  const [setNameError, setSetNameError] = useState("");

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

  // Apply filters when any filter value changes
  useEffect(() => {
    let result = [...questions];

    if (grade !== "all") {
      result = result.filter((q) => q.grade === grade);
    }

    if (topic !== "all") {
      result = result.filter((q) => q.topic === topic);
    }

    if (topicList !== "all") {
      result = result.filter((q) => q.topicList === topicList);
    }

    if (difficultyLevel !== "all") {
      result = result.filter((q) => q.difficultyLevel === difficultyLevel);
    }

    setFilteredQuestions(result);
  }, [questions, grade, topic, topicList, difficultyLevel]);

  const handleAddToSet = async (questionId) => {
    if (!selectedSetName.trim()) {
      setSetNameError("❌ Please enter a valid set name!");
      return;
    }

    setSetNameError("");

    try {
      const setRef = ref(database, `attachedQuestionSets/${selectedSetName}`);
      const snapshot = await get(setRef);

      let nextOrder = 0;

      if (snapshot.exists()) {
        const existingSet = snapshot.val();

        const existingQuestion = Object.values(existingSet).find(
          (item) =>
            (typeof item === "string" && item === questionId) ||
            (typeof item === "object" && item.id === questionId)
        );

        if (existingQuestion) {
          toast.warning(`⚠️ This question is already in set: ${selectedSetName}`);
          return;
        }

        const orders = Object.values(existingSet)
          .map((item) => (typeof item === "object" && item.order !== undefined ? item.order : -1))
          .filter((order) => order !== -1);

        nextOrder = orders.length > 0 ? Math.max(...orders) + 1 : 0;
      }

      const questionRef = ref(database, `attachedQuestionSets/${selectedSetName}/${questionId}`);
      await set(questionRef, {
        id: questionId,
        order: nextOrder,
        addedAt: Date.now(),
      });

      toast.success(`✅ Question added to set: ${selectedSetName} at position ${nextOrder}`);
    } catch (err) {
      console.error("❌ Error adding question to set:", err);
      setError("Failed to attach question to set.");
    }
  };

  const getUniqueValues = (field) => {
    if (questions.length === 0) return [];

    const uniqueValues = [...new Set(questions.map((q) => q[field]).filter(Boolean))];
    return uniqueValues.sort();
  };

  const getFilteredTopicList = () => {
    if (grade === "all" || topic === "all") return getUniqueValues("topicList");

    const filteredValues = questions
      .filter((q) => q.grade === grade && q.topic === topic)
      .map((q) => q.topicList)
      .filter(Boolean);

    return [...new Set(filteredValues)].sort();
  };

  // Function to check if a string contains HTML tags
  const isHTML = (str) => {
    return /<[^>]+>/.test(str);
  };

  return (
    <div className="attachedQuestionsContainer">
      <h2>All Questions</h2>
      <hr />

      <input
        type="text"
        value={selectedSetName}
        onChange={(e) => setSelectedSetName(e.target.value)}
        placeholder="Enter set name"
      />
      {setNameError && <p style={{ color: "red" }}>{setNameError}</p>}
      <hr />

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
            {getFilteredTopicList().map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label>Difficulty:</label>
          <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
            <option value="all">All Difficulty Levels</option>
            {getUniqueValues("difficultyLevel").map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      <div className="questionStats">
        <p>Showing {filteredQuestions.length} of {questions.length} questions</p>
      </div>

      <div className="attachedQuestionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="attachedQuestionItem">
              <strong>{isHTML(q.question) ? parse(q.question) : q.question}</strong> ({q.type})

              <div className="questionMeta">
                {q.grade && <span className="tag">Grade: {q.grade}</span>}
                {q.topic && <span className="tag">Topic: {q.topic}</span>}
                {q.topicList && <span className="tag">Subtopic: {q.topicList}</span>}
                {q.difficultyLevel && <span className="tag">Difficulty: {q.difficultyLevel}</span>}
              </div>

              {q.questionImage && (
                <div>
                  <img
                    src={q.questionImage}
                    alt="Question Attachment"
                    style={{ maxWidth: "300px", marginTop: "10px" }}
                  />
                </div>
              )}

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