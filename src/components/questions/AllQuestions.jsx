import React, { useEffect, useState, useRef } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove, update, push, set, serverTimestamp } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import { ToastContainer, toast } from "react-toastify";
import parse from "html-react-parser";
import JoditEditor from "jodit-react";
import "./AllQuestions.css";
import "../upload/Upload.css"; // Assuming Upload.css exists and is compatible

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
    setEditingQuestion(question);
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

  const isHTML = (str) => /<[^>]+>/.test(str);

  // Upload Component Logic (Integrated)
  const UploadComponent = ({ questionData, onSave, onCancel }) => {
    const [questionType, setQuestionType] = useState(questionData?.type || "MCQ");
    const [question, setQuestion] = useState(questionData?.question || "");
    const editor = useRef(null);
    const [questionImage, setQuestionImage] = useState(null);
    const [questionImageUrl, setQuestionImageUrl] = useState(questionData?.questionImage || null);
    const [options, setOptions] = useState(
      questionData?.options?.map((opt) => opt.text || "") || ["", "", "", ""]
    );
    const [optionImages, setOptionImages] = useState(
      questionData?.options?.map((opt) => null) || [null, null, null, null]
    );
    const [optionImageUrls, setOptionImageUrls] = useState(
      questionData?.options?.map((opt) => opt.image || null) || [null, null, null, null]
    );
    const [mcqAnswer, setMcqAnswer] = useState(
      questionData?.type === "MCQ" ? questionData?.correctAnswer?.text || "" : ""
    );
    const [mcqAnswerImage, setMcqAnswerImage] = useState(null);
    const [mcqAnswerImageUrl, setMcqAnswerImageUrl] = useState(
      questionData?.type === "MCQ" ? questionData?.correctAnswer?.image || null : null
    );
    const [answer, setAnswer] = useState(
      questionData?.type === "FILL_IN_THE_BLANKS" ? questionData?.correctAnswer?.text || "" : ""
    );
    const [answerImage, setAnswerImage] = useState(null);
    const [answerImageUrl, setAnswerImageUrl] = useState(
      questionData?.type === "FILL_IN_THE_BLANKS" ? questionData?.correctAnswer?.image || null : null
    );
    const [loading, setLoading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [questionID, setQuestionID] = useState(questionData?.questionID || "");
    const [topic, setTopic] = useState(questionData?.topic || "Number System");
    const [topicList, setTopicList] = useState(questionData?.topicList || "");
    const [difficultyLevel, setDifficultyLevel] = useState(questionData?.difficultyLevel || "");
    const [grade, setGrade] = useState(questionData?.grade || "G1");

    const config = {
      readonly: false,
      toolbar: true,
      placeholder: "Enter your question here...",
      enter: "BR",
      removeButtons: "source",
      fullpage: false,
      cleanHTML: true,
      sanitize: true,
      autofocus: true,
      askBeforePasteHTML: false,
    };

    const handleTextChange = (content) => {
      setQuestion(content);
    };

    const uploadImageToSupabase = async (file) => {
      if (!file) return null;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from("questions").upload(fileName, file);
      return error ? null : supabase.storage.from("questions").getPublicUrl(fileName).data.publicUrl;
    };

    const deleteImageFromSupabaseLocal = async (imageUrl) => {
      if (!imageUrl) return;
      const fileName = imageUrl.split("/").pop();
      await supabase.storage.from("questions").remove([fileName]);
    };

    const handleQuestionImageChange = async (e) => {
      const file = e.target.files[0];
      if (questionImageUrl) await deleteImageFromSupabaseLocal(questionImageUrl);
      const url = await uploadImageToSupabase(file);
      setQuestionImage(file);
      setQuestionImageUrl(url);
    };

    const handleOptionImageChange = async (e, index) => {
      const file = e.target.files[0];
      if (optionImageUrls[index]) await deleteImageFromSupabaseLocal(optionImageUrls[index]);
      const url = await uploadImageToSupabase(file);
      const newOptionImages = [...optionImages];
      const newOptionImageUrls = [...optionImageUrls];
      newOptionImages[index] = file;
      newOptionImageUrls[index] = url;
      setOptionImages(newOptionImages);
      setOptionImageUrls(newOptionImageUrls);
    };

    const handleMcqAnswerImageChange = async (e) => {
      const file = e.target.files[0];
      if (mcqAnswerImageUrl) await deleteImageFromSupabaseLocal(mcqAnswerImageUrl);
      const url = await uploadImageToSupabase(file);
      setMcqAnswerImage(file);
      setMcqAnswerImageUrl(url);
    };

    const handleAnswerImageChange = async (e) => {
      const file = e.target.files[0];
      if (answerImageUrl) await deleteImageFromSupabaseLocal(answerImageUrl);
      const url = await uploadImageToSupabase(file);
      setAnswerImage(file);
      setAnswerImageUrl(url);
    };

    const handleSave = async () => {
      if (!question && !questionImageUrl) {
        setUploadError("Please enter a question or upload an image");
        return;
      }

      setUploadError(null);
      setLoading(true);
      try {
        const questionRef = ref(database, `questions/${questionData.id}`);
        const today = new Date().toISOString().split("T")[0];

        let updatedData = {
          question,
          questionImage: questionImageUrl,
          type: questionType,
          timestamp: serverTimestamp(),
          date: today,
        };

        if (questionType !== "TRIVIA") {
          updatedData = {
            ...updatedData,
            questionID,
            topic,
            topicList,
            difficultyLevel,
            grade,
            options: questionType === "MCQ" ? options.map((opt, i) => ({ text: opt, image: optionImageUrls[i] })) : [],
            correctAnswer: questionType === "MCQ"
              ? { text: mcqAnswer, image: mcqAnswerImageUrl }
              : { text: answer, image: answerImageUrl },
          };
        }

        await update(questionRef, updatedData);

        setQuestions((prev) =>
          prev.map((q) => (q.id === questionData.id ? { ...q, ...updatedData } : q))
        );
        setFilteredQuestions((prev) =>
          prev.map((q) => (q.id === questionData.id ? { ...q, ...updatedData } : q))
        );

        setLoading(false);
        toast("Question updated successfully");
        onSave();
      } catch (err) {
        setUploadError("Failed to update question");
        setLoading(false);
        console.error("Error updating question:", err);
      }
    };

    return (
      <div className="uploadContainer editMode">
        <h3>Edit Question</h3>
        <div className="formGroup">
          <label>Question Type:</label>
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
            <option value="MCQ">MCQ</option>
            <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
            <option value="TRIVIA">Trivia</option>
          </select>
        </div>
        <div className="formGroup">
          <label>Question:</label>
          <JoditEditor ref={editor} value={question} config={config} onBlur={handleTextChange} />
        </div>
        <div className="formGroup">
          <div className="imageUpload">
            <input type="file" accept="image/*" onChange={handleQuestionImageChange} />
            {questionImageUrl && <div className="imagePreview">Image uploaded: <img src={questionImageUrl} alt="Question" style={{ maxWidth: "100px" }} /></div>}
          </div>
        </div>

        {uploadError && <p className="errorMessage">{uploadError}</p>}

        {questionType !== "TRIVIA" && (
          <>
            <div className="formGroup">
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="G1">Grade 1</option>
                <option value="G2">Grade 2</option>
                <option value="G3">Grade 3</option>
                <option value="G4">Grade 4</option>
              </select>
            </div>
            <div className="formGroup">
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
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
              <input
                type="text"
                placeholder="Subtopic"
                value={topicList}
                onChange={(e) => setTopicList(e.target.value)}
              />
            </div>
            <div className="formGroup">
              <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
                <option value="L1">L1</option>
                <option value="L2 Acupuncture">L2</option>
                <option value="L3">L3</option>
                <option value="Br">Br</option>
              </select>
            </div>
          </>
        )}

        {questionType === "MCQ" && (
          <div className="optionsSection">
            {options.map((option, index) => (
              <div key={index} className="optionContainer">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const updatedOptions = [...options];
                    updatedOptions[index] = e.target.value;
                    setOptions(updatedOptions);
                  }}
                />
                <div className="imageUpload">
                  <input type="file" accept="image/*" onChange={(e) => handleOptionImageChange(e, index)} />
                  {optionImageUrls[index] && <div className="imagePreview">Image uploaded: <img src={optionImageUrls[index]} alt={`Option ${index + 1}`} style={{ maxWidth: "100px" }} /></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {questionType !== "TRIVIA" && (
          <div className="answerSection">
            {questionType === "MCQ" ? (
              <div className="answerContainer">
                <input
                  type="text"
                  placeholder="Correct Answer"
                  value={mcqAnswer}
                  onChange={(e) => setMcqAnswer(e.target.value)}
                />
                <div className="imageUpload">
                  <input type="file" accept="image/*" onChange={handleMcqAnswerImageChange} />
                  {mcqAnswerImageUrl && <div className="imagePreview">Image uploaded: <img src={mcqAnswerImageUrl} alt="Answer" style={{ maxWidth: "100px" }} /></div>}
                </div>
              </div>
            ) : (
              <div className="answerContainer">
                <input
                  type="text"
                  placeholder="Correct Answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <div className="imageUpload">
                  <input type="file" accept="image/*" onChange={handleAnswerImageChange} />
                  {answerImageUrl && <div className="imagePreview">Image uploaded: <img src={answerImageUrl} alt="Answer" style={{ maxWidth: "100px" }} /></div>}
                </div>
              </div>
            )}
          </div>
        )}

        <button className="uploadButton" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button className="cancelButton" onClick={onCancel} disabled={loading}>
          Cancel
        </button>

        <ToastContainer />
      </div>
    );
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
        <UploadComponent
          questionData={editingQuestion}
          onSave={() => setEditingQuestion(null)}
          onCancel={() => setEditingQuestion(null)}
        />
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
              <strong>{isHTML(q.question) ? parse(q.question) : q.question}</strong> ({q.type})
              <small> - {q.timestamp ? new Date(q.timestamp).toLocaleString() : "No Time"}</small>
              <div className="questionMeta">
                {q.grade && <span className="tag">Grade: {q.grade}</span>}
                {q.topic && <span className="tag">Topic: {q.topic}</span>}
                {q.topicList && <span className="tag">Subtopic: {q.topicList}</span>}
                {q.difficultyLevel && <span className="tag">Difficulty: {q.difficultyLevel}</span>}
              </div>
              {q.questionImage && (
                <div>
                  <img src={q.questionImage} alt="Question" style={{ maxWidth: "300px", marginTop: "10px" }} />
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