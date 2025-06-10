import React, { useEffect, useState, useRef } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove, update, serverTimestamp } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import { ToastContainer, toast } from "react-toastify";
import parse from "html-react-parser";
import JoditEditor from "jodit-react";
import DynamicMathSelector from "../DynamicMathSelector";
import "./AllQuestions.css";

import "../upload/Upload.css";

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [grade, setGrade] = useState("all");
  const [topic, setTopic] = useState("all");
  const [topicList, setTopicList] = useState("all");
  const [difficultyLevel, setDifficultyLevel] = useState("all");
  const [questionType, setQuestionType] = useState("all");
useEffect(() => {
  const fetchAllQuestions = async () => {
    try {
      const questionsRef = ref(database, "questions");
      const multiQuestionsRef = ref(database, "multiQuestions");

      const [questionsSnap, multiSnap] = await Promise.all([
        get(questionsRef),
        get(multiQuestionsRef),
      ]);

      let allQuestions = [];

      // 1. Load normal single questions
      if (questionsSnap.exists()) {
        const data = questionsSnap.val();
        const loaded = Object.entries(data).map(([id, q]) => ({
          id,
          ...q,
        }));
        allQuestions.push(...loaded);
      }

      // 2. Load multi questions with subQuestions
      if (multiSnap.exists()) {
        const data = multiSnap.val();

        Object.entries(data).forEach(([multiId, multiItem]) => {
          const mainQuestion = multiItem.mainQuestion || null;
          const grade = multiItem.grade || "";
          const topic = multiItem.topic || "";
          const topicList = multiItem.topicList || "";
          const difficultyLevel = multiItem.difficultyLevel || "";

          if (Array.isArray(multiItem.subQuestions)) {
            multiItem.subQuestions.forEach((subQ, index) => {
              allQuestions.push({
                ...subQ,
                id: `${multiId}_${index}`,
                fromMulti: true,
                multiId,
                mainIndex: 0,
                subIndex: index,
                mainQuestion,
                grade,
                topic,
                topicList,
                difficultyLevel,
              });
            });
          }
        });
      }
   // ✅ ADD THIS LOG HERE
    console.log("🧪 Combined allQuestions:", allQuestions);


      setQuestions(allQuestions);
      setFilteredQuestions(allQuestions);
    } catch (err) {
      console.error("Error loading questions:", err);
      setError("Failed to load questions");
    }
  };

  fetchAllQuestions();
}, []);


useEffect(() => {
  if (!questions || questions.length === 0) {
    setFilteredQuestions([]);
    return;
  }

  // Normalize filter values
  const safeGrade = grade && grade !== "" ? grade : "all";
  const safeTopic = topic && topic !== "" ? topic : "all";
  const safeTopicList = topicList && topicList !== "" ? topicList : "all";
  const safeDifficulty = difficultyLevel && difficultyLevel !== "" ? difficultyLevel : "all";
  const safeQuestionType = questionType && questionType !== "" ? questionType : "all";

  // 🧪 Debug filters and data
  console.log("🧪 Filtering questions...");
  console.log("Grade filter:", safeGrade);
  console.log("Topic filter:", safeTopic);
  console.log("TopicList filter:", safeTopicList);
  console.log("Difficulty filter:", safeDifficulty);
  console.log("Question Type filter:", safeQuestionType);
  console.log("Sample Question[0]:", questions[0]);
  console.log("Sample fromMulti Question:", questions.find((q) => q.fromMulti));
const filtered = questions.filter((q) => {
  return (
    (safeGrade === "all" || q.grade === safeGrade) &&
    (safeTopic === "all" || q.topic === safeTopic) &&
    (safeTopicList === "all" || q.topicList === safeTopicList) &&
    (safeDifficulty === "all" || q.difficultyLevel === safeDifficulty)
    // remove type check for now
    // (safeQuestionType === "all" || q.type === safeQuestionType)
  );
});


  setFilteredQuestions(filtered);
}, [questions, grade, topic, topicList, difficultyLevel, questionType]);



const handleEdit = (question) => {
  if (question.fromMulti) {
    // Parse metadata
    const { multiId, mainIndex, subIndex } = question;
    // Pass all info to editor
    setEditingQuestion(question);
  } else {
    setEditingQuestion(question);
  }
};




const handleDelete = async (question) => {
  const { id, questionImage, options, correctAnswer } = question;

  if (question.fromMulti) {
    const { multiId, mainIndex, subIndex } = question;
  const multiRef = ref(database, `multiQuestions/${multiId}/subQuestions/${subIndex}`);

    
    await Promise.all([
      deleteImageFromSupabase(questionImage),
      ...(options?.map((opt) => deleteImageFromSupabase(opt.image)) || []),
      deleteImageFromSupabase(correctAnswer?.image),
    ]);

    try {
      await remove(multiRef);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setFilteredQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success("Nested question deleted successfully");
    } catch (err) {
      console.error("Error deleting nested question:", err);
      setError("Failed to delete nested question");
    }

  } else {
    // Normal question deletion (already implemented)
    try {
      await remove(ref(database, `questions/${id}`));
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setFilteredQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success("Question deleted successfully");
    } catch (err) {
      console.error("Error deleting question:", err);
      setError("Failed to delete question");
    }
  }
};


  const deleteImageFromSupabase = async (url) => {
    if (!url) return;
    const filePath = url.split("public/questions/")[1];
    try {
      const { error } = await supabase.storage.from("questions").remove([filePath]);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete image from Supabase:", err);
    }
  };

  const isHTML = (str) => /<[^>]+>/.test(str);

  const UploadComponent = ({ questionData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      questionType: questionData?.type || "MCQ",
      question: questionData?.question || "",
      questionImageUrl: questionData?.questionImage || null,
      options: questionData?.options?.map((opt) => ({ text: opt.text || "", image: opt.image || null })) || Array(4).fill({ text: "", image: null }),
      correctAnswer: questionData?.correctAnswer || { text: "", image: null },
      grade: questionData?.grade || "",
      topic: questionData?.topic || "",
      topicList: questionData?.topicList || "",
      difficultyLevel: questionData?.difficultyLevel || "",
    });
    const [loading, setLoading] = useState(false);
    const editor = useRef(null);

    const config = {
      readonly: false,
      toolbar: true,
      placeholder: "Enter your question here...",
      enter: "BR",
      removeButtons: "source",
      fullpage: false,
      cleanHTML: true,
      sanitize: true,
      autofocus: false,
      askBeforePasteHTML: false,
    };

    const uploadImageToSupabase = async (file) => {
      if (!file) return null;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from("questions").upload(fileName, file);
      return error ? null : supabase.storage.from("questions").getPublicUrl(fileName).data.publicUrl;
    };

    const handleImageChange = async (e, field, index) => {
      const file = e.target.files[0];
      const url = await uploadImageToSupabase(file);
      if (!url) return;
      setFormData((prev) => {
        if (field === "questionImageUrl") return { ...prev, [field]: url };
        if (field === "options") {
          const newOptions = [...prev.options];
          newOptions[index].image = url;
          return { ...prev, options: newOptions };
        }
        return { ...prev, correctAnswer: { ...prev.correctAnswer, image: url } };
      });
    };

    const handleSave = async () => {
      if (!formData.question && !formData.questionImageUrl) {
        toast.error("Please enter a question or upload an image");
        return;
      }
      if (!questionData?.id) {
        toast.error("Invalid question ID. Cannot update.");
        return;
      }
      setLoading(true);
      try {
        let questionRef;
if (questionData.fromMulti) {
  const { multiId, mainIndex, subIndex } = questionData;
  questionRef = ref(database, `multiQuestions/${multiId}/questions/${mainIndex}/subQuestions/${subIndex}`);
} else {
  questionRef = ref(database, `questions/${questionData.id}`);
}

        const updatedData = {
          ...formData,
          timestamp: serverTimestamp(),
          date: new Date().toISOString().split("T")[0],
          type: formData.questionType,
        };
        await update(questionRef, updatedData);
        setQuestions((prev) => prev.map((q) => (q.id === questionData.id ? { ...q, ...updatedData } : q)));
        setFilteredQuestions((prev) => prev.map((q) => (q.id === questionData.id ? { ...q, ...updatedData } : q)));
        toast.success("Question updated successfully");
        onSave();
      } catch (err) {
        console.error("Error updating question:", err);
        toast.error("Failed to update question");
      } finally {
        setLoading(false);
      }
    };



const assignSetToUser = async (userId, setId) => {
    try {
        await update(ref(database, `users/${userId}/assignedSets`), {
            [setId]: {
                attachedAt: new Date().toISOString(),
            },
        });

        // Optional: update UI locally if needed
        const updatedAssignedSets = {
            ...selectedUser.assignedSets,
            [setId]: { attachedAt: new Date().toISOString() }
        };

        const updatedUser = { ...selectedUser, assignedSets: updatedAssignedSets };
        setSelectedUser(updatedUser);
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
        setFilteredUsers(filteredUsers.map((u) => (u.id === userId ? updatedUser : u)));

        alert(`Set ${setId} assigned to user ${userId}`);
    } catch (error) {
        console.error("Error assigning set:", error);
        alert("Failed to assign set.");
    }
};

    return (
      <div className="uploadContainer editMode">
        <h3>Edit Question</h3>
        <select value={formData.questionType} onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}>
          <option value="MCQ">MCQ</option>
          <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
          <option value="TRIVIA">Trivia</option>
        </select>
    <JoditEditor
  ref={editor}
  value={formData.question}
  config={config}
  onBlur={(content) => setFormData({ ...formData, question: content })}
/>

        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, "questionImageUrl")} />
        {formData.questionImageUrl && <img src={formData.questionImageUrl} alt="Question" style={{ maxWidth: "100px" }} />}

        {formData.questionType !== "TRIVIA" && (
          <>
            <DynamicMathSelector
              grade={formData.grade}
              setGrade={(val) => setFormData({ ...formData, grade: val })}
              topic={formData.topic}
              setTopic={(val) => setFormData({ ...formData, topic: val })}
              topicList={formData.topicList}
              setTopicList={(val) => setFormData({ ...formData, topicList: val })}
            />
            <select value={formData.difficultyLevel} onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}>
              <option value="">Select Difficulty</option>
              {["L1", "L2", "L3", "Br"].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </>
        )}

        {formData.questionType === "MCQ" && (
          <div className="optionsSection">
            {formData.options.map((option, index) => (
              <div key={index}>
                <input type="text" value={option.text} onChange={(e) => {
                  const newOptions = [...formData.options];
                  newOptions[index].text = e.target.value;
                  setFormData({ ...formData, options: newOptions });
                }} />
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, "options", index)} />
                {option.image && <img src={option.image} alt={`Option ${index + 1}`} style={{ maxWidth: "100px" }} />}
              </div>
            ))}
          </div>
        )}

        {formData.questionType !== "TRIVIA" && (
          <div>
            <input type="text" value={formData.correctAnswer.text} onChange={(e) => setFormData({ ...formData, correctAnswer: { ...formData.correctAnswer, text: e.target.value } })} />
            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, "correctAnswer")} />
            {formData.correctAnswer.image && <img src={formData.correctAnswer.image} alt="Answer" style={{ maxWidth: "100px" }} />}
          </div>
        )}

        <button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
        <button onClick={onCancel} disabled={loading}>Cancel</button>
        <ToastContainer />
      </div>
    );
  };

  return (
    <div className="allQuestionContainer">
      <h2>All Questions</h2>
      <hr />
      <div className="filterControls">
        {/* Using the horizontal-filters class to override DynamicMathSelector vertical styles */}
        <div className="horizontal-filters">
          <DynamicMathSelector grade={grade} setGrade={setGrade} topic={topic} setTopic={setTopic} topicList={topicList} setTopicList={setTopicList} />
          
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

      {editingQuestion && <UploadComponent questionData={editingQuestion} onSave={() => setEditingQuestion(null)} onCancel={() => setEditingQuestion(null)} />}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {filteredQuestions.length === 0 && !error && <p>No questions found!</p>}
      <p>Showing {filteredQuestions.length} of {questions.length} questions</p>

      <div className="questionList">
        <ol>
        {filteredQuestions.map((q) => (

          
  <li key={q.id} className="questionItem">
    {q.mainQuestion && (
      <p style={{ fontWeight: "bold", color: "purple" }}>Main: {q.mainQuestion}</p>
    )}

    {q.fromMulti && (
      <p style={{ fontWeight: "bold", color: "orange" }}>
        🧩 Sub-question (#{q.subIndex + 1}) from Multi-ID: {q.multiId}
      </p>
    )}
 

    <strong>
      {q.question
        ? isHTML(q.question)
          ? parse(q.question)
          : q.question
        : "❓ No Question Text"}
    </strong>{" "}
    ({q.type})

    <small>
      {" "}-{" "}
      {q.timestamp
        ? new Date(q.timestamp).toLocaleString()
        : "No Time"}
    </small>

    {q.questionImage && (
      <div>
        <img
          src={q.questionImage}
          alt="Question"
          style={{ maxWidth: "300px" }}
        />
      </div>
    )}

    {/* Show MCQ Options if available */}
    {q.type === "MCQ" && Array.isArray(q.options) && (
      <ul>
        {q.options.map((opt, idx) => (
          <li key={idx}>
            {typeof opt === "string" ? opt : opt?.text}
            {opt?.image && (
              <img
                src={opt.image}
                alt={`Option ${idx + 1}`}
                style={{ maxWidth: "100px", marginLeft: "8px" }}
              />
            )}
          </li>
        ))}
      </ul>
    )}

    {q.correctAnswer && (
      <p>
        <strong>Correct Answer:</strong>{" "}
        {typeof q.correctAnswer === "string"
          ? q.correctAnswer
          : q.correctAnswer?.text}
        {q.correctAnswer?.image && (
          <img
            src={q.correctAnswer.image}
            alt="Answer"
            style={{ maxWidth: "100px", marginLeft: "8px" }}
          />
        )}
      </p>
    )}

    <button className="editButton" onClick={() => handleEdit(q)}>
      Edit
    </button>
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
