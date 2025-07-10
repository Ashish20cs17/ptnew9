import React, { useEffect, useState, useRef } from "react";
import { ref, get, update, serverTimestamp } from "firebase/database";
import { database } from "../firebase/FirebaseSetup";
import JoditEditor from "jodit-react";
import { ToastContainer, toast } from "react-toastify";
import DynamicMathSelector from "../DynamicMathSelector";
import "../upload/Upload.css";
import "jodit/es5/jodit.min.css"; // ✅ Correct and required for styling


const MultiQuestionEditor = ({ multiId, onCancel, onSave }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const editorRefs = useRef([]);


useEffect(() => {
  const fetchData = async () => {
    try {
      const baseSnap = await get(ref(database, `multiQuestions/${multiId}`));

      if (!baseSnap.exists()) {
        toast.error("Multi-question not found");
        return;
      }

      const baseData = baseSnap.val();

      // ✅ Fetch subQuestions separately
      const subsSnap = await get(ref(database, `multiQuestions/${multiId}/subQuestions`));

      setData({
        ...baseData,
        subQuestions: Object.values(subsSnap.val() || {}),
      });

    } catch (err) {
      console.error("Error fetching data", err);
      toast.error("Error fetching data");
    }
  };

  fetchData();
}, [multiId]);



const handleUpdate = async () => {
  setLoading(true);
  try {
    // Save each sub-question
    const subQs = data.subQuestions || [];

    for (let i = 0; i < subQs.length; i++) {
      const subRef = ref(
        database,
        `multiQuestions/${multiId}/questions/0/subQuestions/${i}`
      );

      await update(subRef, {
        ...subQs[i],
        type: subQs[i].type || "MCQ",
        timestamp: serverTimestamp(),
      });
    }

    // Save main metadata
    await update(ref(database, `multiQuestions/${multiId}`), {
      mainQuestion: data.mainQuestion,
      grade: data.grade,
      topic: data.topic,
      topicList: data.topicList,
      difficultyLevel: data.difficultyLevel,
      updatedAt: serverTimestamp(),
    });

    toast.success("Multi-question updated!");
    onSave(); // 🔁 trigger refresh in parent
  } catch (err) {
    console.error("Update failed:", err);
    toast.error("Update failed");
  } finally {
    setLoading(false);
  }
};

  const updateSubQField = (index, field, value) => {
    const newSub = [...data.subQuestions];
    newSub[index][field] = value;
    setData({ ...data, subQuestions: newSub });
  };

  const updateOption = (subIndex, optIndex, value) => {
    const newSub = [...data.subQuestions];
    newSub[subIndex].options[optIndex] = value;
    setData({ ...data, subQuestions: newSub });
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div className="uploadContainer">
      <h2>Edit Multi-Question</h2>
      <label>Main Question:</label>
      <JoditEditor
        value={data.mainQuestion}
        onBlur={(content) => setData({ ...data, mainQuestion: content })}
      />

      <h3>Sub Questions</h3>
      {data.subQuestions.map((sq, i) => (
        <div key={i} className="subQuestionBlock">
          <label>Sub #{i + 1}</label>
          <JoditEditor
            value={sq.question}
            onBlur={(content) => updateSubQField(i, "question", content)}
          />

          <label>Type:</label>
          <select
            value={sq.type}
            onChange={(e) => updateSubQField(i, "type", e.target.value)}
          >
            <option value="MCQ">MCQ</option>
            <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
            <option value="TRIVIA">Trivia</option>
          </select>

          {sq.type === "MCQ" && (
            <>
              <label>Options:</label>
              {sq.options.map((opt, j) => (
                <input
                  key={j}
                  type="text"
                  value={opt}
                  placeholder={`Option ${j + 1}`}
                  onChange={(e) => updateOption(i, j, e.target.value)}
                />
              ))}
            </>
          )}

          {sq.type !== "TRIVIA" && (
            <>
              <label>Correct Answer:</label>
              <input
                type="text"
                value={sq.correctAnswer}
                onChange={(e) => updateSubQField(i, "correctAnswer", e.target.value)}
              />
            </>
          )}
        </div>
      ))}

      <DynamicMathSelector
        grade={data.grade}
        setGrade={(val) => setData({ ...data, grade: val })}
        topic={data.topic}
        setTopic={(val) => setData({ ...data, topic: val })}
        topicList={data.topicList}
        setTopicList={(val) => setData({ ...data, topicList: val })}
      />

      <label>Difficulty Level:</label>
      <select
        value={data.difficultyLevel}
        onChange={(e) => setData({ ...data, difficultyLevel: e.target.value })}
      >
        <option value="">Select Difficulty</option>
        {["L1", "L2", "L3", "Br"].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <br />
      <button onClick={handleUpdate} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
      <button onClick={onCancel} disabled={loading}>Cancel</button>
      <ToastContainer />
    </div>
  );
};

export default MultiQuestionEditor;