import React, { useEffect, useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove, update } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import parse from "html-react-parser"; // Import html-react-parser
import "./AllQuestions.css";

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

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

  useEffect(() => {
    let result = [...questions];
    if (grade !== "all") result = result.filter((q) => q.grade === grade);
    if (topic !== "all") result = result.filter((q) => q.topic === topic);
    if (topicList !== "all") result = result.filter((q) => q.topicList === topicList);
    if (difficultyLevel !== "all") result = result.filter((q) => q.difficultyLevel === difficultyLevel);
    setFilteredQuestions(result);
  }, [questions, grade, topic, topicList, difficultyLevel]);

  const handleEdit = (question) => {
    setEditingQuestion({ ...question });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      const questionRef = ref(database, `questions/${editingQuestion.id}`);

      const updates = {
        question: editingQuestion.question || "",
        type: editingQuestion.type,
        timestamp: editingQuestion.timestamp || new Date().toISOString(),
      };

      if (editingQuestion.grade) updates.grade = editingQuestion.grade;
      if (editingQuestion.topic) updates.topic = editingQuestion.topic;
      if (editingQuestion.topicList) updates.topicList = editingQuestion.topicList;
      if (editingQuestion.difficultyLevel) updates.difficultyLevel = editingQuestion.difficultyLevel;
      if (editingQuestion.type === "MCQ" && editingQuestion.options) {
        updates.options = editingQuestion.options.filter((opt) => opt.text || opt.image);
      }
      if (editingQuestion.correctAnswer) updates.correctAnswer = editingQuestion.correctAnswer;

      await update(questionRef, updates);

      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? { ...q, ...updates } : q))
      );
      setFilteredQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? { ...q, ...updates } : q))
      );

      setEditingQuestion(null);
      console.log("✅ Question updated successfully");
    } catch (err) {
      console.error("❌ Error updating question:", err);
      setError("Failed to update question");
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...editingQuestion.options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setEditingQuestion({
      ...editingQuestion,
      options: newOptions,
    });
  };

  const handleCorrectAnswerChange = (field, value) => {
    setEditingQuestion({
      ...editingQuestion,
      correctAnswer: {
        ...editingQuestion.correctAnswer,
        [field]: value,
      },
    });
  };

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
    await deleteImageFromSupabase(questionImage);
    if (options) {
      for (const option of options) {
        await deleteImageFromSupabase(option.image);
      }
    }
    await deleteImageFromSupabase(correctAnswer?.image);

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
    <div className="allQuestionContainer">
      <h2>All Questions</h2>
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

      {editingQuestion && (
        <div className="editForm">
          <h3>Edit Question</h3>
          <form onSubmit={handleUpdate}>
            <div className="formGroup">
              <label>Question:</label>
              <input
                type="text"
                value={editingQuestion.question || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    question: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="formGroup">
              <label>Type:</label>
              <select
                value={editingQuestion.type || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    type: e.target.value,
                  })
                }
                required
              >
                <option value="MCQ">Multiple Choice</option>
                <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
              </select>
            </div>

            <div className="formGroup">
              <label>Grade:</label>
              <select
                value={editingQuestion.grade || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    grade: e.target.value,
                  })
                }
              >
                <option value="">Select Grade</option>
                <option value="G1">Grade 1</option>
                <option value="G2">Grade 2</option>
                <option value="G3">Grade 3</option>
                <option value="G4">Grade 4</option>
              </select>
            </div>

            <div className="formGroup">
              <label>Topic:</label>
              <select
                value={editingQuestion.topic || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    topic: e.target.value,
                  })
                }
              >
                <option value="">Select Topic</option>
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
              <input
                type="text"
                value={editingQuestion.topicList || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    topicList: e.target.value,
                  })
                }
              />
            </div>

            <div className="formGroup">
              <label>Difficulty:</label>
              <input
                type="text"
                value={editingQuestion.difficultyLevel || ""}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    difficultyLevel: e.target.value,
                  })
                }
              />
            </div>

            {editingQuestion.type === "MCQ" && (
              <div className="optionsSection">
                <h4>Options:</h4>
                {editingQuestion.options?.map((option, index) => (
                  <div key={index} className="optionItem">
                    <input
                      type="text"
                      value={option.text || ""}
                      onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                      placeholder={`Option ${index + 1} text`}
                    />
                    {option.image && (
                      <img
                        src={option.image}
                        alt={`Option ${index + 1}`}
                        style={{ maxWidth: "100px", margin: "5px" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="formGroup">
              <h4>Correct Answer:</h4>
              <input
                type="text"
                value={editingQuestion.correctAnswer?.text || ""}
                onChange={(e) => handleCorrectAnswerChange("text", e.target.value)}
                placeholder="Correct answer text"
                required
              />
              {editingQuestion.correctAnswer?.image && (
                <img
                  src={editingQuestion.correctAnswer.image}
                  alt="Correct answer"
                  style={{ maxWidth: "100px", margin: "5px" }}
                />
              )}
            </div>

            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setEditingQuestion(null)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error ? <p>No questions found!</p> : null}

      <div className="questionStats">
        <p>Showing {filteredQuestions.length} of {questions.length} questions</p>
      </div>

      <div className="questionList">
        <ol>
          {filteredQuestions.map((q) => (
            <li key={q.id} className="questionItem">
              <strong>
                {isHTML(q.question) ? parse(q.question) : q.question}
              </strong>{" "}
              ({q.type})
              <small> - {q.timestamp ? new Date(q.timestamp).toLocaleString() : "No Time"}</small>

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
                    alt="Question"
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

              {q.type === "FILL_IN_THE_BLANKS" && <p>Answer: {q.correctAnswer.text}</p>}

              <div className="questionActions">
                <button className="editButton" onClick={() => handleEdit(q)}>
                  Edit
                </button>
                <button className="deleteButton" onClick={() => handleDelete(q)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AllQuestions;