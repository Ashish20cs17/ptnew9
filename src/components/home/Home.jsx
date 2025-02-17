import React, { useState } from 'react';
import { db } from "../firebase/FirebaseSetup"; // Import Firestore instance
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Firestore functions
import PracticeTime from "../../assets/practiceTime.jpg";

const Home = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to handle text field changes
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  // Function to save the question to Firestore
  const uploadQuestion = async () => {
    if (!question || options.some(opt => opt === '')) {
      setError("Please fill all fields");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const questionsRef = collection(db, `questions/${today}/allQuestions`);
      
      await addDoc(questionsRef, {
        question,
        option1: options[0],
        option2: options[1],
        option3: options[2],
        option4: options[3],
        timestamp: serverTimestamp(),
      });

      // Clear inputs after successful upload
      setQuestion('');
      setOptions(['', '', '', '']);
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

      <input 
        placeholder="Enter the question" 
        type="text" 
        required 
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <hr />

      {options.map((option, index) => (
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

      <button id="Upload" onClick={uploadQuestion} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default Home;
