import React, { useEffect, useState, useRef } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, get, remove, update } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import { ToastContainer, toast } from "react-toastify";
import parse from "html-react-parser";
import JoditEditor from "jodit-react";
import "./AllQuestions.css";
import "../upload/Upload.css";

// Centralized data structure (moved from DynamicMathSelector)
const MATH_DATA = {
  grades: [
    { code: "G1", text: "Grade 1" },
    { code: "G2", text: "Grade 2" },
    { code: "G3", text: "Grade 3" },
    { code: "G4", text: "Grade 4" },
  ],
  topics: [
    { grade: "G1", code: "G1A", text: "Number System" },
    { grade: "G2", code: "G2A", text: "Number System" },
    { grade: "G3", code: "G3A", text: "Number System" },
    { grade: "G4", code: "G4A", text: "Number System" },
    { grade: "G1", code: "G1B", text: "Operations (Addition, Subtraction ....)" },
    { grade: "G2", code: "G2B", text: "Operations (Addition, Subtraction ....)" },
    { grade: "G3", code: "G3B", text: "Operations (Addition, Subtraction ....)" },
    { grade: "G4", code: "G4B", text: "Operations (Addition, Subtraction ....)" },
    { grade: "G1", code: "G1C", text: "Shapes and Geometry" },
    { grade: "G2", code: "G2C", text: "Shapes and Geometry" },
    { grade: "G3", code: "G3C", text: "Shapes and Geometry" },
    { grade: "G4", code: "G4C", text: "Shapes and Geometry" },
    { grade: "G1", code: "G1D", text: "Measurement" },
    { grade: "G2", code: "G2D", text: "Measurement" },
    { grade: "G3", code: "G3D", text: "Measurement" },
    { grade: "G4", code: "G4D", text: "Measurement" },
    { grade: "G1", code: "G1E", text: "Data Handling" },
    { grade: "G2", code: "G2E", text: "Data Handling" },
    { grade: "G3", code: "G3E", text: "Data Handling" },
    { grade: "G4", code: "G4E", text: "Data Handling" },
    { grade: "G1", code: "G1F", text: "Maths Puzzles" },
    { grade: "G2", code: "G2F", text: "Maths Puzzles" },
    { grade: "G3", code: "G3F", text: "Maths Puzzles" },
    { grade: "G4", code: "G4F", text: "Maths Puzzles" },
    { grade: "G1", code: "G1G", text: "Real Life all concept sums" },
    { grade: "G2", code: "G2G", text: "Real Life all concept sums" },
    { grade: "G3", code: "G3G", text: "Real Life all concept sums" },
    { grade: "G4", code: "G4G", text: "Real Life all concept sums" },
  ],
  subtopics: {
    G1A: {
      G1: [
        { code: "G1A.1", text: "Place Value & Number Names" },
        { code: "G1A.2", text: "Skip Counting" },
        { code: "G1A.3", text: "Comparing & Ordering Numbers" },
        { code: "G1A.4", text: "Ordinal Numbers" },
        { code: "G1A.5", text: "Number Patterns" },
        { code: "G1A.6", text: "Addition & Subtraction of Larger Numbers" },
        { code: "G1A.7", text: "Understanding Zero" },
        { code: "G1A.8", text: "Expanded & Standard Form" },
      ],
    },
    G2A: {
      G2: [
        { code: "G2A.1", text: "Place Value & Number Names" },
        { code: "G2A.2", text: "Skip Counting" },
        { code: "G2A.3", text: "Comparing & Ordering Numbers" },
        { code: "G2A.4", text: "Ordinal Numbers" },
        { code: "G2A.5", text: "Number Patterns" },
        { code: "G2A.6", text: "Addition & Subtraction of Larger Numbers" },
        { code: "G2A.7", text: "Understanding the Concept of Zero" },
        { code: "G2A.8", text: "Writing Numbers in Expanded & Standard Form" },
      ],
    },
    G3A: {
      G3: [
        { code: "G3A.1", text: "Place Value & Number Names" },
        { code: "G3A.2", text: "Skip Counting" },
        { code: "G3A.3", text: "Comparing & Ordering Numbers" },
        { code: "G3A.4", text: "Ordinal Numbers" },
        { code: "G3A.5", text: "Number Patterns" },
        { code: "G3A.6", text: "Addition & Subtraction of Larger Numbers" },
        { code: "G3A.7", text: "Understanding the Concept of Zero" },
        { code: "G3A.8", text: "Writing Numbers in Expanded & Standard Form" },
      ],
    },
    G4A: {
      G4: [
        { code: "G4A.1", text: "Place Value & Number Names" },
        { code: "G4A.2", text: "Rounding & Estimation" },
        { code: "G4A.3", text: "Roman Numerals" },
        { code: "G4A.4", text: "Factors & Multiples" },
        { code: "G4A.5", text: "Number Patterns" },
        { code: "G4A.6", text: "Negative Numbers (Introduction)" },
        { code: "G4A.7", text: "Even & Odd Properties" },
        { code: "G4A.8", text: "Operations with Larger Numbers" },
      ],
    },
    G1B: {
      G1: [
        { code: "G1B.1", text: "Addition & Subtraction with Carrying/Borrowing" },
        { code: "G1B.2", text: "Multiplication as Repeated Addition" },
        { code: "G1B.3", text: "Understanding Multiplication Tables" },
        { code: "G1B.4", text: "Simple Division Concepts" },
        { code: "G1B.5", text: "Fact Families" },
        { code: "G1B.6", text: "Properties of Addition and Multiplication" },
      ],
    },
    G2B: {
      G2: [
        { code: "G2B.1", text: "Addition, Subtraction, Multiplication, Division" },
        { code: "G2B.2", text: "Multiplication as Repeated Addition" },
        { code: "G2B.3", text: "Understanding Multiplication Tables" },
        { code: "G2B.4", text: "Simple Division Concepts" },
        { code: "G2B.5", text: "Fact Families" },
        { code: "G2B.6", text: "Properties of Operations" },
      ],
    },
    G4B: {
      G4: [
        { code: "G4B.1", text: "Addition & Subtraction (Larger Numbers)" },
        { code: "G4B.2", text: "Multiplication & Division (Advanced)" },
        { code: "G4B.3", text: "Properties of Operations" },
        { code: "G4B.4", text: "Fractions & Decimals Operations" },
        { code: "G4B.5", text: "BODMAS & Order of Operations" },
        { code: "G4B.6", text: "Multiplication & Division of Decimals" },
        { code: "G4B.7", text: "Word Problems & Mixed Operations" },
        { code: "G4B.8", text: "Estimation & Approximation" },
      ],
    },
    // Add other subtopics as needed
  },
};

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

  const filteredTopics = grade === "all" ? MATH_DATA.topics : MATH_DATA.topics.filter((t) => t.grade === grade);
  const filteredSubtopics =
    grade === "all" || topic === "all" ? [] : MATH_DATA.subtopics[topic]?.[grade] || [];

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
    const [topic, setTopic] = useState(questionData?.topic || "");
    const [topicList, setTopicList] = useState(questionData?.topicList || "");
    const [difficultyLevel, setDifficultyLevel] = useState(questionData?.difficultyLevel || "");
    const [grade, setGrade] = useState(questionData?.grade || "");

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
            {questionImageUrl && (
              <div className="imagePreview">
                Image uploaded: <img src={questionImageUrl} alt="Question" style={{ maxWidth: "100px" }} />
              </div>
            )}
          </div>
        </div>

        {uploadError && <p className="errorMessage">{uploadError}</p>}

        {questionType !== "TRIVIA" && (
          <>
            <div className="formGroup">
              <label>Grade:</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">Select Grade</option>
                {MATH_DATA.grades.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.text}
                  </option>
                ))}
              </select>
            </div>
            <div className="formGroup">
              <label>Topic:</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Select Topic</option>
                {grade &&
                  MATH_DATA.topics
                    .filter((t) => t.grade === grade)
                    .map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.text}
                      </option>
                    ))}
              </select>
            </div>
            <div className="formGroup">
              <label>Subtopic:</label>
              <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
                <option value="">Select Subtopic</option>
                {grade &&
                  topic &&
                  MATH_DATA.subtopics[topic]?.[grade]?.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.text}
                    </option>
                  ))}
              </select>
            </div>
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
                  {optionImageUrls[index] && (
                    <div className="imagePreview">
                      Image uploaded: <img src={optionImageUrls[index]} alt={`Option ${index + 1}`} style={{ maxWidth: "100px" }} />
                    </div>
                  )}
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
                  {mcqAnswerImageUrl && (
                    <div className="imagePreview">
                      Image uploaded: <img src={mcqAnswerImageUrl} alt="Answer" style={{ maxWidth: "100px" }} />
                    </div>
                  )}
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
                  {answerImageUrl && (
                    <div className="imagePreview">
                      Image uploaded: <img src={answerImageUrl} alt="Answer" style={{ maxWidth: "100px" }} />
                    </div>
                  )}
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
            {MATH_DATA.grades.map((g) => (
              <option key={g.code} value={g.code}>
                {g.text}
              </option>
            ))}
          </select>
        </div>
        <div className="formGroup">
          <label>Topic:</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">All Topics</option>
            {filteredTopics.map((t) => (
              <option key={t.code} value={t.code}>
                {t.text}
              </option>
            ))}
          </select>
        </div>
        <div className="formGroup">
          <label>Subtopic:</label>
          <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
            <option value="all">All Subtopics</option>
            {filteredSubtopics.map((st) => (
              <option key={st.code} value={st.code}>
                {st.text}
              </option>
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
                {q.grade && (
                  <span className="tag">
                    Grade: {MATH_DATA.grades.find((g) => g.code === q.grade)?.text || q.grade}
                  </span>
                )}
                {q.topic && (
                  <span className="tag">
                    Topic: {MATH_DATA.topics.find((t) => t.code === q.topic)?.text || q.topic}
                  </span>
                )}
                {q.topicList && (
                  <span className="tag">
                    Subtopic:{" "}
                    {MATH_DATA.subtopics[q.topic]?.[q.grade]?.find((st) => st.code === q.topicList)?.text ||
                      q.topicList}
                  </span>
                )}
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