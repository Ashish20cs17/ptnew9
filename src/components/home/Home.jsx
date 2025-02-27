import React, { useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, push, set, serverTimestamp } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import PracticeTime from "../../assets/practiceTime.jpg";
import { ToastContainer, toast } from 'react-toastify';
import "./Home.css"

const Home = () => {
  const [questionType, setQuestionType] = useState("MCQ");
  const [question, setQuestion] = useState("");
  const [questionImage, setQuestionImage] = useState(null);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [optionImages, setOptionImages] = useState([null, null, null, null]);
  const [mcqAnswer, setMcqAnswer] = useState("");
  const [mcqAnswerImage, setMcqAnswerImage] = useState(null);
  const [answer, setAnswer] = useState("");
  const [answerImage, setAnswerImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questionID, setQuestionID] = useState("");
  const [topic, setTopic] = useState("");
  const [topicList, setTopicList] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [grade, setGrade] = useState("G1");

  const uploadImageToSupabase = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from("questions").upload(fileName, file);
    return error ? null : supabase.storage.from("questions").getPublicUrl(fileName).data.publicUrl;
  };

  const uploadQuestion = async () => {
    if (!question && !questionImage) {
      setError("Please enter a question or upload an image");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const uploadedQuestionImage = await uploadImageToSupabase(questionImage);
      const uploadedOptionImages = await Promise.all(optionImages.map(uploadImageToSupabase));
      const uploadedAnswerImage = await uploadImageToSupabase(answerImage);
      const uploadedMcqAnswerImage = await uploadImageToSupabase(mcqAnswerImage);
      const today = new Date().toISOString().split("T")[0];
      const questionsRef = ref(database, `questions`);
      const newQuestionRef = push(questionsRef);
      const questionData = {
        question,
        questionImage: uploadedQuestionImage,
        type: questionType,
        options: options.map((opt, i) => ({ text: opt, image: uploadedOptionImages[i] })),
        correctAnswer: questionType === "MCQ" ? { text: mcqAnswer, image: uploadedMcqAnswerImage } : { text: answer, image: null },
        timestamp: serverTimestamp(),
        date: today,
        questionID,
        topic,
        topicList,
        difficultyLevel,
        grade,
      };
      await set(newQuestionRef, questionData);
      setQuestion("");
      setQuestionImage(null);
      setOptions(["", "", "", ""]);
      setOptionImages([null, null, null, null]);
      setMcqAnswer("");
      setMcqAnswerImage(null);
      setAnswer("");
      setAnswerImage(null);
      setLoading(false);
      toast("Question uploaded successfully");
    } catch (error) {
      setError("Failed to upload question");
      setLoading(false);
    }
  };

  return (
    <div className="uploadContainer">
    
      <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
        <option value="MCQ">MCQ</option>
        <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
      </select>
      <textarea placeholder="Enter the question" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <input type="file" accept="image/*" onChange={(e) => setQuestionImage(e.target.files[0])} />
      {error && <p className="errorMessage">{error}</p>}
      <input placeholder="Question ID" type="text" value={questionID} onChange={(e) => setQuestionID(e.target.value)} />
      <input placeholder="Topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <input placeholder="Topic List" type="text" value={topicList} onChange={(e) => setTopicList(e.target.value)} />
      <input placeholder="Difficulty Level" type="text" value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)} />
      <select value={grade} onChange={(e) => setGrade(e.target.value)}>
        <option value="G1">G1</option>
        <option value="G2">G2</option>
        <option value="G3">G3</option>
        <option value="G4">G4</option>
        <option value="G5">G5</option>
      </select>
      
      {questionType === "MCQ" && options.map((option, index) => (
        <div key={index} className="optionContainer">
          <input type="text" placeholder={`Option ${index + 1}`} value={option} onChange={(e) => {
            const updatedOptions = [...options];
            updatedOptions[index] = e.target.value;
            setOptions(updatedOptions);
          }} />
          <input type="file" accept="image/*" onChange={(e) => {
            const updatedImages = [...optionImages];
            updatedImages[index] = e.target.files[0];
            setOptionImages(updatedImages);
          }} />
        </div>
      ))}
      {questionType === "MCQ" ? (
        <div className="answerContainer">
          <input type="text" placeholder="Correct Answer" value={mcqAnswer} onChange={(e) => setMcqAnswer(e.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => setMcqAnswerImage(e.target.files[0])} />
        </div>
      ) : (
        <div className="answerContainer">
          <input type="text" placeholder="Correct Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
      )}
      <button onClick={uploadQuestion} disabled={loading}>{loading ? "Uploading..." : "Upload"}</button>
      <ToastContainer />
    </div>
  );
};

export default Home;
