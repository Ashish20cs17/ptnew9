import React, { useEffect, useState } from "react";
import "./AttachedQuestions.css";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, set } from "firebase/database";
import { ToastContainer, toast } from "react-toastify";
import parse from "html-react-parser";
import DynamicMathSelector from "../DynamicMathSelector";

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
  const [questionType, setQuestionType] = useState("all");

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
    const filtered = questions.filter((q) => (
      (grade === "all" || q.grade === grade) &&
      (topic === "all" || q.topic === topic) &&
      (topicList === "all" || q.topicList === topicList) &&
      (difficultyLevel === "all" || q.difficultyLevel === difficultyLevel) &&
      (questionType === "all" || q.type === questionType)
    ));
    setFilteredQuestions(filtered);
  }, [questions, grade, topic, topicList, difficultyLevel, questionType]);

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

  // Function to check if a string contains HTML tags
  const isHTML = (str) => {
    return /<[^>]+>/.test(str);
  };

  return (
    <div className="allQuestionContainer attachedQuestionsContainer">
      <h2>All Questions</h2>
      <hr />

      <div className="set-name-input">
        <input
          type="text"
          value={selectedSetName}
          onChange={(e) => setSelectedSetName(e.target.value)}
          placeholder="Enter set name"
          className="set-name-field"
        />
        {setNameError && <p style={{ color: "red" }}>{setNameError}</p>}
      </div>
      <hr />

      <div className="filterControls">
        <div className="horizontal-filters">
          <DynamicMathSelector 
            grade={grade} 
            setGrade={setGrade} 
            topic={topic} 
            setTopic={setTopic} 
            topicList={topicList} 
            setTopicList={setTopicList} 
          />
          
          <div className="formGroup">
            <label htmlFor="questionTypeFilter">Question Type:</label>
            <select 
              id="questionTypeFilter"
              value={questionType} 
              onChange={(e) => setQuestionType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="MCQ">MCQ</option>
              <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
              <option value="TRIVIA">Trivia</option>
            </select>
          </div>
          
          <div className="formGroup">
            <label htmlFor="difficultyFilter">Difficulty Level:</label>
            <select 
              id="difficultyFilter"
              value={difficultyLevel} 
              onChange={(e) => setDifficultyLevel(e.target.value)}
            >
              <option value="all">All Difficulty Levels</option>
              {["L1", "L2", "L3", "Br"].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      <div className="questionStats">
        <p>Showing {filteredQuestions.length} of {questions.length} questions</p>
      </div>

      <div className="questionList attachedQuestionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="questionItem attachedQuestionItem">
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
              </div>
            </li>
          ))}
        </ol>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AttachedQuestion;