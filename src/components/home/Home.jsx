import React, { useState } from "react";
import { database } from "../firebase/FirebaseSetup"; // Import Realtime DB
import { ref, push, set, serverTimestamp } from "firebase/database"; // Realtime DB functions
import supabase from "../supabase/SupabaseConfig"; // Supabase client
import PracticeTime from "../../assets/practiceTime.jpg";

const Home = () => {
  const [questionType, setQuestionType] = useState("MCQ"); // Default: MCQ
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]); // Options for MCQ
  const [mcqAnswer, setMcqAnswer] = useState(""); // Correct answer for MCQ
  const [answer, setAnswer] = useState(""); // Answer for Fill in the Blanks
  const [image, setImage] = useState(null); // Image file
  const [uploadProgress, setUploadProgress] = useState(0); // Image upload progress
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const uploadImageToSupabase = async (file) => {
    setUploadProgress(10); // Start progress

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("questions") // Bucket name
      .upload(fileName, file, {
        upsert: false, // Prevent overwriting
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        }
      });

    if (error) {
      console.error("❌ Image upload failed:", error.message);
      setUploadProgress(0);
      return null;
    }

    setUploadProgress(100); // Upload complete
    return supabase.storage.from("questions").getPublicUrl(fileName).data.publicUrl;
  };

  const uploadQuestion = async () => {
    if (
      !question ||
      (questionType === "MCQ" && (options.some((opt) => opt === "") || !mcqAnswer)) ||
      (questionType === "Fill in the Blanks" && !answer)
    ) {
      setError("Please fill all required fields");
      return;
    }

    setError(null);
    setLoading(true);
    setUploadProgress(0);

    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImageToSupabase(image);
      }

      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const questionsRef = ref(database, `questions`);
      const newQuestionRef = push(questionsRef);

      const questionData = {
        question,
        type: questionType,
        timestamp: serverTimestamp(),
        date: today,
        ...(imageUrl && { imageUrl }), // Include image URL only if an image is uploaded
      };

      if (questionType === "MCQ") {
        questionData.options = options;
        questionData.correctAnswer = mcqAnswer;
      } else {
        questionData.answer = answer;
      }

      await set(newQuestionRef, questionData);

      // Reset form
      setQuestion("");
      setOptions(["", "", "", ""]);
      setMcqAnswer("");
      setAnswer("");
      setImage(null);
      setUploadProgress(0);
      setLoading(false);
      alert("✅ Question uploaded successfully!");
    } catch (error) {
      console.error("❌ Error uploading question:", error);
      setError("Failed to upload question");
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <img src={PracticeTime} alt="Practice Time" className="loginImage" />
      <hr />
      {error && <p className="errorMessage">{error}</p>}

      {/* Question Type Selection */}
      <div>
        <label>
          <input type="radio" value="MCQ" checked={questionType === "MCQ"} onChange={() => setQuestionType("MCQ")} />
          MCQ
        </label>
        <label>
          <input type="radio" value="Fill in the Blanks" checked={questionType === "Fill in the Blanks"} onChange={() => setQuestionType("Fill in the Blanks")} />
          Fill in the Blanks
        </label>
      </div>
      <hr />

      {/* Question Input */}
      <input placeholder="Enter the question" type="text" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <hr />

      {/* MCQ Options */}
      {questionType === "MCQ" && options.map((option, index) => (
        <React.Fragment key={index}>
          <input placeholder={`Option ${index + 1}`} type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} />
          <hr />
        </React.Fragment>
      ))}

      {/* Correct Answer for MCQ */}
      {questionType === "MCQ" && <input placeholder="Enter the correct answer" type="text" value={mcqAnswer} onChange={(e) => setMcqAnswer(e.target.value)} />}<hr />
      
      {/* Answer for Fill in the Blanks */}
      {questionType === "Fill in the Blanks" && <input placeholder="Enter the correct answer" type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} />}<hr />

      {/* Image Upload (Optional) */}
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
      <hr />

      {/* Image Upload Progress Bar */}
      {uploadProgress > 0 && (
        <div className="progressBar">
          <div className="progressFill" style={{ width: `${uploadProgress}%` }}></div>
          <span>{uploadProgress}%</span>
        </div>
      )}

      <button id="Upload" onClick={uploadQuestion} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>

      
    </div>
  );
};

export default Home;
