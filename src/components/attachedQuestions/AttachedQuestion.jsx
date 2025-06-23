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
        const dbRef = ref(database);
        const snapshot = await get(dbRef);

        const singleQuestions = snapshot.child("questions");
        const multiQuestions = snapshot.child("multiQuestions");

        const combined = [];

        // ✅ Process Single Questions
        singleQuestions.forEach((child) => {
          combined.push({ id: child.key, ...child.val() });
        });

        // ✅ Process Multi Questions (flatten subQuestions)
        multiQuestions.forEach((child) => {
          const multiData = child.val();
          const multiId = child.key;

          if (Array.isArray(multiData.subQuestions)) {
            combined.push({
              id: multiId,
              fromMulti: true,
              multiId,
              mainQuestion: multiData.mainQuestion || "",
              subQuestions: multiData.subQuestions,
              grade: multiData.grade,
              topic: multiData.topic,
              topicList: multiData.topicList,
              difficultyLevel: multiData.difficultyLevel,
              timestamp: multiData.createdAt,
            });
          }
        });

        // ✅ Sort by latest
        combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        setQuestions(combined);
        setFilteredQuestions(combined);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to fetch questions");
      }
    };

    fetchAllQuestions();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = questions.filter(
      (q) =>
        (grade === "all" || q.grade === grade) &&
        (topic === "all" || q.topic === topic) &&
        (topicList === "all" || q.topicList === topicList) &&
        (difficultyLevel === "all" || q.difficultyLevel === difficultyLevel) &&
        (questionType === "all" || q.type === questionType)
    );
    setFilteredQuestions(filtered);
  }, [questions, grade, topic, topicList, difficultyLevel, questionType]);

  const handleAddToSet = async (questionId, isMulti = false, multiData = null) => {
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
          (item) => item.id === questionId
        );
        if (existingQuestion) {
          toast.warning(`⚠️ This question is already in set: ${selectedSetName}`);
          return;
        }

        const orders = Object.values(existingSet)
          .map((item) =>
            item && typeof item === "object" && item.order !== undefined
              ? item.order
              : -1
          )
          .filter((order) => order !== -1);

        nextOrder = orders.length > 0 ? Math.max(...orders) + 1 : 0;
      }

      const cleanQuestionId = questionId;

      const questionRef = ref(
        database,
        `attachedQuestionSets/${selectedSetName}/${cleanQuestionId}`
      );

      const payload = {
        id: cleanQuestionId,
        order: nextOrder,
        addedAt: Date.now(),
      };

      if (isMulti && multiData) {
        payload.isMulti = true;
        payload.mainQuestion = multiData.mainQuestion;
        payload.subQuestions = multiData.subQuestions;
        payload.grade = multiData.grade;
        payload.topic = multiData.topic;
        payload.topicList = multiData.topicList;
        payload.difficultyLevel = multiData.difficultyLevel;
      }

      await set(questionRef, payload);

      toast.success(`✅ Added to set "${selectedSetName}" at position ${nextOrder}`);
    } catch (err) {
      console.error("❌ Error adding question to set:", err);
      setError("Failed to attach question to set.");
    }
  };

  const isHTML = (str) => /<[^>]+>/.test(str);

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
              {["L1", "L2", "L3", "Br"].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? (
        <p>No questions found!</p>
      ) : null}

      <div className="questionStats">
        <p>
          Showing {filteredQuestions.length} of {questions.length} questions
        </p>
      </div>

      <div className="questionList attachedQuestionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="questionItem attachedQuestionItem">
              {q.fromMulti ? (
                <>
                  {/* ✅ Main Question */}
                  <div
                    style={{
                      backgroundColor: "#f2f2f2",
                      padding: "8px",
                      marginBottom: "8px",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Main Question:</strong>
                    <br />
                    {isHTML(q.mainQuestion)
                      ? parse(q.mainQuestion)
                      : q.mainQuestion}
                  </div>

                  {/* ✅ Subquestions (no numbering) */}
                  <div>
                    {q.subQuestions?.map((subQ, index) => (
                      <div key={index} style={{ marginBottom: "1.2rem" }}>
                        <div style={{ color: "green" }}>
                          <strong>
                            {isHTML(subQ.question)
                              ? parse(subQ.question)
                              : subQ.question}
                          </strong>{" "}
                          ({subQ.type})
                        </div>

                        <div className="questionMeta">
                          {q.grade && (
                            <span className="tag">Grade: {q.grade}</span>
                          )}
                          {q.topic && (
                            <span className="tag">Topic: {q.topic}</span>
                          )}
                          {q.topicList && (
                            <span className="tag">
                              Subtopic: {q.topicList}
                            </span>
                          )}
                          {q.difficultyLevel && (
                            <span className="tag">
                              Difficulty: {q.difficultyLevel}
                            </span>
                          )}
                        </div>

                        {subQ.correctAnswer && (
                          <p>
                            <strong>Correct Answer:</strong>{" "}
                            {typeof subQ.correctAnswer === "string"
                              ? subQ.correctAnswer
                              : subQ.correctAnswer.text}
                            {subQ.correctAnswer.image && (
                              <img
                                src={subQ.correctAnswer.image}
                                alt="Correct Answer"
                                style={{
                                  maxWidth: "100px",
                                  marginLeft: "10px",
                                }}
                              />
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ✅ Single Add to Set Button */}
                  <div>
                    <button
                      className="addQuestionButton"
                      onClick={() => handleAddToSet(q.id, true, q)}
                    >
                      {selectedSetName
                        ? `Add main + subquestions to ${selectedSetName}`
                        : "Add to Set"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* ✅ Single Question */}
                  <div>
                    <strong>
                      {isHTML(q.question)
                        ? parse(q.question)
                        : q.question}
                    </strong>{" "}
                    ({q.type})
                  </div>

                  <div className="questionMeta">
                    {q.grade && (
                      <span className="tag">Grade: {q.grade}</span>
                    )}
                    {q.topic && (
                      <span className="tag">Topic: {q.topic}</span>
                    )}
                    {q.topicList && (
                      <span className="tag">Subtopic: {q.topicList}</span>
                    )}
                    {q.difficultyLevel && (
                      <span className="tag">
                        Difficulty: {q.difficultyLevel}
                      </span>
                    )}
                  </div>

                  {q.correctAnswer && (
                    <p>
                      <strong>Correct Answer:</strong>{" "}
                      {typeof q.correctAnswer === "string"
                        ? q.correctAnswer
                        : q.correctAnswer.text}
                      {q.correctAnswer.image && (
                        <img
                          src={q.correctAnswer.image}
                          alt="Correct Answer"
                          style={{
                            maxWidth: "100px",
                            marginLeft: "10px",
                          }}
                        />
                      )}
                    </p>
                  )}

                  <div>
                    <button
                      className="addQuestionButton"
                      onClick={() => handleAddToSet(q.id)}
                    >
                      {selectedSetName
                        ? `Add question to ${selectedSetName}`
                        : "Add to Set"}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AttachedQuestion;
