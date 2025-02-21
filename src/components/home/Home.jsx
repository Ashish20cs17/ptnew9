import React, { useState } from 'react';
import { db } from "../firebase/FirebaseSetup"; // Import Firestore instance
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Firestore functions
import PracticeTime from "../../assets/practiceTime.jpg";

const Home = () => {
  const [questionType, setQuestionType] = useState("MCQ"); // Default: MCQ
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']); // Options for MCQ
  const [mcqAnswer, setMcqAnswer] = useState(''); // Correct answer for MCQ
  const [answer, setAnswer] = useState(''); // Answer for Fill in the Blanks
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to handle option text field changes
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  // Function to save the question to Firestore
  const uploadQuestion = async () => {
    if (!question || 
        (questionType === "MCQ" && (options.some(opt => opt === '') || !mcqAnswer)) || 
        (questionType === "Fill in the Blanks" && !answer)) {
      setError("Please fill all fields");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const questionsRef = collection(db, `questions/${today}/allQuestions`);
      
      const questionData = {
        question,
        type: questionType,
        timestamp: serverTimestamp(),
      };

      if (questionType === "MCQ") {
        questionData.option1 = options[0];
        questionData.option2 = options[1];
        questionData.option3 = options[2];
        questionData.option4 = options[3];
        questionData.correctAnswer = mcqAnswer; // ✅ Correct answer for MCQ
      } else {
        questionData.answer = answer;
      }

      await addDoc(questionsRef, questionData);

      // Clear inputs after successful upload
      setQuestion('');
      setOptions(['', '', '', '']);
      setMcqAnswer('');
      setAnswer('');
      setLoading(false);
      alert("Question uploaded successfully!");
    } catch (error) {
      console.error("Error uploading question: ", error);
      setError("Failed to upload question");
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <img src={PracticeTime} alt="Practice Time" className="loginImage" />
      <hr />

      {error && <p className="errorMessage">{error}</p>}

      {/* Radio buttons to select question type */}
      <div>
        <label>
          <input 
            type="radio" 
            value="MCQ" 
            checked={questionType === "MCQ"} 
            onChange={() => setQuestionType("MCQ")} 
          />
          MCQ
        </label>
        <label>
          <input 
            type="radio" 
            value="Fill in the Blanks" 
            checked={questionType === "Fill in the Blanks"} 
            onChange={() => setQuestionType("Fill in the Blanks")} 
          />
          Fill in the Blanks
        </label>
      </div>
      <hr />

      {/* Question Input */}
      <input 
        placeholder="Enter the question" 
        type="text" 
        required 
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <hr />

      {/* MCQ Options (Shown Only If MCQ is Selected) */}
      {questionType === "MCQ" && options.map((option, index) => (
        <React.Fragment key={index}>
          <input
            placeholder={`Option ${index + 1}`}
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
          />
          <hr />
        </React.Fragment>
      ))}

      {/* ✅ Correct Answer Field for MCQ */}
      {questionType === "MCQ" && (
        <>
          <input 
            placeholder="Enter the correct answer" 
            type="text" 
            required 
            value={mcqAnswer} 
            onChange={(e) => setMcqAnswer(e.target.value)} 
          />
          <hr />
        </>
      )}

      {/* Answer Field for Fill in the Blanks */}
      {questionType === "Fill in the Blanks" && (
        <>
          <input 
            placeholder="Enter the correct answer" 
            type="text" 
            required 
            value={answer} 
            onChange={(e) => setAnswer(e.target.value)} 
          />
          <hr />
        </>
      )}

      <button id="Upload" onClick={uploadQuestion} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default Home;
