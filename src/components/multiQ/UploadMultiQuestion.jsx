import React, { useState, useRef } from "react";
import JoditEditor from "jodit-react";
import "./Upload.css";
import { database } from "../firebase/FirebaseSetup";
import { ref, push, set, serverTimestamp } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import { ToastContainer, toast } from "react-toastify";
import DynamicMathSelector from "../DynamicMathSelector";
const UploadMultiQuestion = () => {
  const [grade, setGrade] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [topicList, setTopicList] = useState("");

  const [mainQuestions, setMainQuestions] = useState([
    {
      mainQuestion: "",
      subQuestions: [
        { question: "", options: ["", "", "", ""], correctAnswer: "", type: "MCQ" },
      ],
    },
  ]);

  const editorRefs = useRef([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateMainQuestion = (mainIndex, value) => {
    const updated = [...mainQuestions];
    updated[mainIndex].mainQuestion = value;
    setMainQuestions(updated);
  };

  const updateSubQuestion = (mainIndex, subIndex, field, value) => {
    const updated = [...mainQuestions];
    updated[mainIndex].subQuestions[subIndex][field] = value;
    setMainQuestions(updated);
  };

  const updateOption = (mainIndex, subIndex, optIndex, value) => {
    const updated = [...mainQuestions];
    updated[mainIndex].subQuestions[subIndex].options[optIndex] = value;
    setMainQuestions(updated);
  };

  const addSubQuestion = (mainIndex) => {
    const updated = [...mainQuestions];
    updated[mainIndex].subQuestions.push({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      type: "MCQ",
    });
    setMainQuestions(updated);
  };

  const removeSubQuestion = (mainIndex, subIndex) => {
    const updated = [...mainQuestions];
    updated[mainIndex].subQuestions.splice(subIndex, 1);
    setMainQuestions(updated);
  };

  const addMainQuestion = () => {
    setMainQuestions([
      ...mainQuestions,
      {
        mainQuestion: "",
        subQuestions: [
          { question: "", options: ["", "", "", ""], correctAnswer: "", type: "MCQ" },
        ],
      },
    ]);
  };

 const uploadMultiQuestions = async () => {
  setError("");
  if (!grade || !difficultyLevel || !topic || !topicList) {
    setError("Please select Grade, Difficulty, Topic, and Topic List.");
    return;
  }

  for (let i = 0; i < mainQuestions.length; i++) {
    const mainQ = mainQuestions[i];

    if (!mainQ.mainQuestion.trim()) {
      setError(`Main question #${i + 1} is empty.`);
      return;
    }

    for (let j = 0; j < mainQ.subQuestions.length; j++) {
      const sq = mainQ.subQuestions[j];
      if (!sq.question.trim()) {
        setError(`Sub-question #${j + 1} in main question #${i + 1} is empty.`);
        return;
      }
      if (sq.type === "MCQ") {
        if (sq.options.every(opt => !opt.trim())) {
          setError(`Sub-question #${j + 1} in main question #${i + 1}: Fill at least one option.`);
          return;
        }
        if (!sq.correctAnswer.trim()) {
          setError(`Sub-question #${j + 1} in main question #${i + 1}: Add correct answer.`);
          return;
        }
      }
    }
  }

  setLoading(true);
  try {
    const questionsRef = ref(database, "multiQuestions");


    for (let mainQ of mainQuestions) {
      const newRef = push(questionsRef);
      await set(newRef, {
        grade,
        difficultyLevel,
        topic,
        topicList,
        mainQuestion: mainQ.mainQuestion,
        subQuestions: mainQ.subQuestions,
        createdAt: serverTimestamp(),
      });
    }

    toast.success("Questions uploaded successfully!");

    // Reset form
    setMainQuestions([
      {
        mainQuestion: "",
        subQuestions: [
          { question: "", options: ["", "", "", ""], correctAnswer: "", type: "MCQ" },
        ],
      },
    ]);
    setGrade("");
    setDifficultyLevel("");
    setTopic("");
    setTopicList("");
  } catch (err) {
    setError("Upload failed: " + err.message);
    toast.error("Upload failed: " + err.message);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="uploadMultiContainer">
      <h2>Upload Multiple Questions</h2>
      <DynamicMathSelector
        grade={grade}
        setGrade={setGrade}
        topic={topic}
        setTopic={setTopic}
        topicList={topicList}
        setTopicList={setTopicList}
      />

      <div className="formGroup">
        <label>Difficulty Level:</label>
        <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
          <option value="">Select Difficulty</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
          <option value="Br">Br</option>
        </select>
      </div>

      {mainQuestions.map((mainQ, mainIndex) => (
        <div key={mainIndex} className="subQuestionBlock">
          <label>Main Question #{mainIndex + 1}:</label>
          <JoditEditor
            ref={(el) => (editorRefs.current[mainIndex] = el)}
            value={mainQ.mainQuestion}
            onBlur={(content) => updateMainQuestion(mainIndex, content)}
            onChange={() => {}}
          />

          <h4 style={{ marginTop: 20 }}>Sub Questions</h4>
          {mainQ.subQuestions.map((sq, subIndex) => (
            <div key={subIndex} className="subQuestionBlock">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label>Question #{subIndex + 1}</label>
                <button
                  type="button"
                  onClick={() => removeSubQuestion(mainIndex, subIndex)}
                  disabled={mainQ.subQuestions.length === 1}
                >Remove</button>
              </div>
              <JoditEditor
                ref={(el) => {
                  if (!editorRefs.current[mainIndex]) editorRefs.current[mainIndex] = [];
                  editorRefs.current[mainIndex][subIndex] = el;
                }}
                value={sq.question}
                onBlur={(content) => updateSubQuestion(mainIndex, subIndex, "question", content)}
                onChange={() => {}}
              />

              <label>Question Type:</label>
              <select
                value={sq.type}
                onChange={(e) => updateSubQuestion(mainIndex, subIndex, "type", e.target.value)}
              >
                <option value="MCQ">MCQ</option>
                <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
                <option value="TRIVIA">Trivia</option>
              </select>

              {sq.type === "MCQ" && (
                <>
                  <label>Options:</label>
                  {sq.options.map((opt, optIndex) => (
                    <input
                      key={optIndex}
                      type="text"
                      placeholder={`Option ${optIndex + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(mainIndex, subIndex, optIndex, e.target.value)}
                    />
                  ))}

                  <label>Correct Answer:</label>
                  <input
                    type="text"
                    placeholder="Correct Answer"
                    value={sq.correctAnswer}
                    onChange={(e) => updateSubQuestion(mainIndex, subIndex, "correctAnswer", e.target.value)}
                  />
                </>
              )}
            </div>
          ))}

          <button type="button" onClick={() => addSubQuestion(mainIndex)}>+ Add Sub Question</button>
        </div>
      ))}

      <button type="button" onClick={addMainQuestion}>+ Add Main Question</button>

      {error && <div className="errorMsg">{error}</div>}

      <button type="button" className="uploadBtn" onClick={uploadMultiQuestions} disabled={loading}>
        {loading ? "Uploading..." : "Upload All Questions"}
      </button>

      <ToastContainer position="top-center" />
    </div>
  );
};

export default UploadMultiQuestion;