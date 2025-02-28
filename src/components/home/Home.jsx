import React, { useState } from "react";
import { database } from "../firebase/FirebaseSetup";
import { ref, push, set, serverTimestamp } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import { ToastContainer, toast } from "react-toastify";
import "./Home.css";

const Home = () => {
  const [questionType, setQuestionType] = useState("MCQ");
  const [question, setQuestion] = useState("");
  const [questionImage, setQuestionImage] = useState(null);
  const [questionImageUrl, setQuestionImageUrl] = useState(null);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [optionImages, setOptionImages] = useState([null, null, null, null]);
  const [optionImageUrls, setOptionImageUrls] = useState([null, null, null, null]);
  const [mcqAnswer, setMcqAnswer] = useState("");
  const [mcqAnswerImage, setMcqAnswerImage] = useState(null);
  const [mcqAnswerImageUrl, setMcqAnswerImageUrl] = useState(null);
  const [answer, setAnswer] = useState("");
  const [answerImage, setAnswerImage] = useState(null);
  const [answerImageUrl, setAnswerImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questionID, setQuestionID] = useState("");
  const [topic, setTopic] = useState("");
  const [topicList, setTopicList] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [grade, setGrade] = useState("G1");

  // Upload image to Supabase and return the URL
  const uploadImageToSupabase = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from("questions").upload(fileName, file);
    return error ? null : supabase.storage.from("questions").getPublicUrl(fileName).data.publicUrl;
  };

  // Delete image from Supabase
  const deleteImageFromSupabase = async (imageUrl) => {
    if (!imageUrl) return;
    const fileName = imageUrl.split("/").pop();
    await supabase.storage.from("questions").remove([fileName]);
  };

  // Handle Question Image Selection
  const handleQuestionImageChange = async (e) => {
    const file = e.target.files[0];
    if (questionImageUrl) {
      await deleteImageFromSupabase(questionImageUrl);
    }
    const url = await uploadImageToSupabase(file);
    setQuestionImage(file);
    setQuestionImageUrl(url);
  };

  // Handle Option Image Selection
  const handleOptionImageChange = async (e, index) => {
    const file = e.target.files[0];
    if (optionImageUrls[index]) {
      await deleteImageFromSupabase(optionImageUrls[index]);
    }
    const url = await uploadImageToSupabase(file);
    const newOptionImages = [...optionImages];
    const newOptionImageUrls = [...optionImageUrls];
    newOptionImages[index] = file;
    newOptionImageUrls[index] = url;
    setOptionImages(newOptionImages);
    setOptionImageUrls(newOptionImageUrls);
  };

  // Handle MCQ Answer Image Selection
  const handleMcqAnswerImageChange = async (e) => {
    const file = e.target.files[0];
    if (mcqAnswerImageUrl) {
      await deleteImageFromSupabase(mcqAnswerImageUrl);
    }
    const url = await uploadImageToSupabase(file);
    setMcqAnswerImage(file);
    setMcqAnswerImageUrl(url);
  };

  // Handle Fill-in-the-Blanks Answer Image Selection
  const handleAnswerImageChange = async (e) => {
    const file = e.target.files[0];
    if (answerImageUrl) {
      await deleteImageFromSupabase(answerImageUrl);
    }
    const url = await uploadImageToSupabase(file);
    setAnswerImage(file);
    setAnswerImageUrl(url);
  };

  // Upload Question Data to Firebase
  const uploadQuestion = async () => {
    if (!question && !questionImageUrl) {
      setError("Please enter a question or upload an image");
      return;
    }
    
    if (!questionID) {
      setError("Please enter a Question ID");
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const questionsRef = ref(database, `questions`);
      const newQuestionRef = push(questionsRef);
      const questionData = {
        questionID,
        topic,
        topicList,
        difficultyLevel,
        grade,
        question,
        questionImage: questionImageUrl,
        type: questionType,
        options: options.map((opt, i) => ({ text: opt, image: optionImageUrls[i] })),
        correctAnswer: questionType === "MCQ"
          ? { text: mcqAnswer, image: mcqAnswerImageUrl }
          : { text: answer, image: answerImageUrl },
        timestamp: serverTimestamp(),
        date: today,
      };
      await set(newQuestionRef, questionData);

      // Reset states after upload
      setQuestion("");
      setQuestionImage(null);
      setQuestionImageUrl(null);
      setOptions(["", "", "", ""]);
      setOptionImages([null, null, null, null]);
      setOptionImageUrls([null, null, null, null]);
      setMcqAnswer("");
      setMcqAnswerImage(null);
      setMcqAnswerImageUrl(null);
      setAnswer("");
      setAnswerImage(null);
      setAnswerImageUrl(null);
      setQuestionID("");
      setTopic("");
      setTopicList("");
      setDifficultyLevel("");
      setGrade("G1");
      setLoading(false);
      toast("Question uploaded successfully");
    } catch (error) {
      setError("Failed to upload question");
      setLoading(false);
    }
  };

  return (
    <div className="uploadContainer">
      {/* Question Type Selection */}
      <div className="formGroup">
        <label>Question Type:</label>
        <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
          <option value="MCQ">MCQ</option>
          <option value="FILL_IN_THE_BLANKS">Fill in the Blanks</option>
        </select>
      </div>
      
    
      
      {/* Question Content */}
      <div className="formGroup">
        
        <textarea 
          placeholder="Enter the question" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
        />
        <div className="imageUpload">
          
          <input type="file" accept="image/*" onChange={handleQuestionImageChange} />
          {questionImageUrl && <div className="imagePreview">Image uploaded</div>}
        </div>
      </div>
      
      {error && <p className="errorMessage">{error}</p>}

        {/* Additional Fields */}
        <div className="formGroup">
        
        <input 
          type="text" 
          placeholder="Enter Question ID" 
          value={questionID} 
          onChange={(e) => setQuestionID(e.target.value)} 
        />
      </div>
      
      <div className="formGroup">
       
        <input 
          type="text" 
          placeholder="Enter Topic" 
          value={topic} 
          onChange={(e) => setTopic(e.target.value)} 
        />
      </div>
      
      <div className="formGroup">
        
        <input 
          type="text" 
          placeholder="Enter Topic List" 
          value={topicList} 
          onChange={(e) => setTopicList(e.target.value)} 
        />
      </div>
      
      <div className="formGroup">
        
        <input 
          type="text" 
          placeholder="Enter Difficulty Level" 
          value={difficultyLevel} 
          onChange={(e) => setDifficultyLevel(e.target.value)} 
        />
      </div>
      
      <div className="formGroup">
        
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="G1">Grade 1</option>
          <option value="G2">Grade 2</option>
          <option value="G3">Grade 3</option>
          <option value="G4">Grade 4</option>
          <option value="G5">Grade 5</option>
        </select>
      </div>

      {/* MCQ Options */}
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
                {optionImageUrls[index] && <div className="imagePreview">Image uploaded</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer Section */}
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
              {mcqAnswerImageUrl && <div className="imagePreview">Image uploaded</div>}
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
              {answerImageUrl && <div className="imagePreview">Image uploaded</div>}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button 
        className="uploadButton" 
        onClick={uploadQuestion} 
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Question"}
      </button>
      
      <ToastContainer />
    </div>
  );
};

export default Home;