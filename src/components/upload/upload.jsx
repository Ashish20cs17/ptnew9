
import { database } from "../firebase/FirebaseSetup";
import { ref, push, set, serverTimestamp } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import { ToastContainer, toast } from "react-toastify";

import React, { useState, useRef } from 'react';
import JoditEditor from 'jodit-react';
import "./Upload.css";


const Upload = () => {
  const [questionType, setQuestionType] = useState("MCQ");
  const [question, setQuestion] = useState("");
 
  const editor = useRef(null); // Reference for Jodit Editor
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
  const [topic, setTopic] = useState("Number System");
  const [topicList, setTopicList] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [grade, setGrade] = useState("G1");
  const config = {
    readonly: false,
    toolbar: true,
    placeholder: "Enter your question here...",
    enter: "BR", // Adds line breaks instead of wrapping in <p>
    removeButtons: "source", // Disable "Code View" to prevent manual tag editing
    fullpage: false,
    cleanHTML: true,
    sanitize: true,
  };

  const handleTextChange = (content) => {
    // Remove HTML tags to keep only the plain text
    const plainText = content.replace(/<\/?[^>]+(>|$)/g, "");
    setQuestion(plainText);
  }
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


    const editor = useRef(null);
    const [content, setContent] = useState('');


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
    
    // // Only check for questionID if not Trivia type
    // if (questionType !== "TRIVIA" && !questionID) {
    //   setError("Please enter a Question ID");
    //   return;
    // }
    
    setError(null);
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const questionsRef = ref(database, `questions`);
      const newQuestionRef = push(questionsRef);
      
      // Base question data for all question types
      let questionData = {
        question,
        questionImage: questionImageUrl, // Include image URL for all question types
        type: questionType,
        timestamp: serverTimestamp(),
        date: today,
      };
      
      // Add additional fields only for non-Trivia questions
      if (questionType !== "TRIVIA") {
        questionData = {
          ...questionData,
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
      
      await set(newQuestionRef, questionData);

      // Reset states after upload
      setQuestion("");
      setQuestionImage(null);
      setQuestionImageUrl(null);
      
      if (questionType !== "TRIVIA") {
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
      }
      
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
          <option value="TRIVIA">Trivia</option>
        </select>
      </div>
      <div className="formGroup">
        <label>Question:</label>
        <JoditEditor
        value={question}
        config={config}
        onChange={handleTextChange} // Passes plain text without HTML
      />


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

      {/* Additional Fields (only show for non-Trivia questions) */}
      {questionType !== "TRIVIA" && (
        <>
          <div className="formGroup">
            <input 
              type="text" 
              placeholder="Enter Question ID" 
              value={questionID} 
              onChange={(e) => setQuestionID(e.target.value)} 
              readOnly
            />
          </div>
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
              <option value="Operations">Operations (Addition, Subtraction ....)</option>
              <option value="Shapes and Geometry">Shapes and Geometry</option>
              <option value="Measurement">Measurement</option>
              <option value="Data Handling">Data Handling</option>
              <option value="Maths Puzzles">Maths Puzzles</option>
              <option value="Real Life all concept sums">Real Life all concept sums</option>
            </select>
          </div>


          {topic === "Number System" && grade === "G1" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G1A.1">Place Value & Number
              Names</option>
              <option value="G1A.2">Skip Counting</option>
              <option value="G1A.3">Comparing & Ordering
              Numbers</option>
              <option value="G1A.4">Ordinal Numbers</option>
              <option value="G1A.5">Number Patterns</option>
              <option value="G1A.6">Addition & Subtraction of
              Larger Numbers</option>
              <option value="G1A.7">Understanding Zero</option>
              <option value="G1A.8">Expanded & Standard Form</option>
            </select>
           
          </div>
          </>)}


          {topic === "Number System" && grade === "G2" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G2A.1">Place Value & Number
              Names</option>
              <option value="G2A.2">Skip Counting</option>
              <option value="G2A.3">Comparing & Ordering
              Numbers</option>
              <option value="G2A.4">Ordinal Numbers</option>
              <option value="G2A.5">Number Patterns</option>
              <option value="G2A.6">Addition & Subtraction of
              Larger Numbers</option>
              <option value="G2A.7">Understanding the Concept
              of Zero</option>
              <option value="G2A.8">Writing Numbers in Expanded
              & Standard Form</option>
            </select>
           
          </div>
          </>)}

          {topic === "Number System" && grade === "G3" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G3A.1">Place Value & Number
              Names</option>
              <option value="G3A.2">Skip Counting</option>
              <option value="G3A.3">Comparing & Ordering
              Numbers</option>
              <option value="G3A.4">Ordinal Numbers</option>
              <option value="G3A.5">Number Patterns</option>
              <option value="G3A.6">Addition & Subtraction of
              Larger Numbers</option>
              <option value="G3A.7">Understanding the Concept
              of Zero</option>
              <option value="G3A.8">Writing Numbers in Expanded
              & Standard Form</option>
            </select>
           
          </div>
          </>)}
          
          {topic === "Number System" && grade === "G4" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G4A.1">Place Value & Number
              Names</option>
              <option value="G4A.2">Rounding & Estimation</option>
              <option value="G4A.3">Roman Numerals</option>
              <option value="G4A.4">Factors & Multiples</option>
              <option value="G4A.5">Number Patterns</option>
              <option value="G4A.6">Negative Numbers
              (Introduction)</option>
              <option value="G4A.7">Even & Odd Properties</option>
              <option value="G4A.8">Operations with Larger
              Numbers</option>
            </select>
           
          </div>
          </>)}

          {topic === "Operations" && grade === "G1" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G1B.1">Addition & Subtraction with
              Carrying/Borrowing</option>
              <option value="G1B.2">Multiplication as Repeated
              Addition</option>
              <option value="G1B.3">Understanding Multiplication
              Tables</option>
              <option value="G1B.4">Simple Division Concepts</option>
              <option value="G1B.5">Fact Families</option>
              <option value="G1B.6">Properties of Addition and
              Multiplication</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Operations" && grade === "G2" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G2B.1">Addition, Subtraction,
              Multiplication, Division</option>
              <option value="G2B.2">Multiplication as Repeated
              Addition</option>
              <option value="G2B.3">Understanding Multiplication
              Tables</option>
              <option value="G2B.4">Simple Division Concepts</option>
              <option value="G2B.5">Fact Families</option>
              <option value="G2B.6">Properties of Operations</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Operations" && grade === "G3" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G3B.1">Addition, Subtraction,
              Multiplication, Division</option>
              <option value="G3B.2">Multiplication as Repeated
              Addition</option>
              <option value="G3B.3">Division Concepts</option>
              <option value="G3B.4">Combined Concepts Additon, Subtraction...</option>
              <option value="G3B.5">Fact Families</option>
              <option value="G3B.6">Properties of Operations</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Operations" && grade === "G4" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G4B.1">Addition & Subtraction
              (Larger Numbers)</option>
              <option value="G4B.2">Multiplication & Division
              (Advanced)</option>
              <option value="G4B.3">Properties of Operations</option>
              <option value="G4B.4">Fractions & Decimals
              Operations</option>
              <option value="G4B.5">BODMAS & Order of
              Operations</option>
              <option value="G4B.6">Multiplication & Division of
              Decimals</option>
              <option value="G4B.7">Word Problems & Mixed
              Operations</option>
              <option value="G4B.8">Estimation & Approximation</option>
            </select>
           
          </div>
          </>)}


          {topic === "Shapes and Geometry" && grade === "G1" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G1C.1">Basic 2D Shapes</option>
              <option value="G1C.2">Solid Shapes (3D Shapes)</option>
              <option value="G1C.3">Symmetry</option>
      
              
            </select>
           
          </div>
          </>)}

          {topic === "Shapes and Geometry" && grade === "G2" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G2C.1">Basic 2D Shapes</option>
              <option value="G2C.2">Solid Shapes (3D Shapes)</option>
              <option value="G2C.3">Symmetry</option>
      
              
            </select>
           
          </div>
          </>)}

          {topic === "Shapes and Geometry" && grade === "G3" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G3C.1">Basic 2D Shapes</option>
              <option value="G3C.2">Solid Shapes (3D Shapes)</option>
              <option value="G3C.3">Symmetry & Transformations</option>
      
              
            </select>
           
          </div>
          </>)}


          {topic === "Shapes and Geometry" && grade === "G4" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G4C.1">2D & 3D Shapes</option>
              <option value="G4C.2">Symmetry & Transformations</option>
              <option value="G4C.3">Perimeter & Area</option>
              <option value="G4C.4">Introduction to Volume</option>
              <option value="G4C.5">Coordinate Geometry
              (Introduction)</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Measurement" && grade === "G1" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G1D.1">Length (cm, m)</option>
              <option value="G1D.2">Weight (kg, g)</option>
              <option value="G1D.3">Capacity (L, mL)</option>
              <option value="G1D.4">Time (Hours, Minutes)</option>
              <option value="G1D.5">Money (Coins, Notes)</option>
              <option value="G1D.6">Introduction to Calendar(Days,Months,Years)</option>
              
              
            </select>
           
          </div>
          </>)}

          {topic === "Measurement" && grade === "G2" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G2D.1">Length (cm, m)</option>
              <option value="G2D.2">Weight (kg, g)</option>
              <option value="G2D.3">Capacity (L, mL)</option>
              <option value="G2D.4">Time (Hours, Minutes,
                Seconds)</option>
              <option value="G2D.5">Money (Coins, Notes)</option>
              <option value="G2D.6">Introduction to Calendar(Days,Months,Years)</option>
              
              
            </select>
           
          </div>
          </>)}

          {topic === "Measurement" && grade === "G3" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G3D.1">Length (cm, m, km)</option>
              <option value="G3D.2">Weight (kg, g)</option>
              <option value="G3D.3">Capacity (L, mL)</option>
              <option value="G3D.4">Time (Hours, Minutes,
                Seconds)</option>
              <option value="G3D.5">Money & Transactions</option>
              
              
            </select>
           
          </div>
          </>)}

          {topic === "Measurement" && grade === "G4" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G4D.1">Length, Weight & Capacity</option>
              <option value="G4D.2">Time & Money</option>
              <option value="G4D.3">Temperature & Speed</option>
              <option value="G4D.4">Measurement Word
              Problems</option>
              <option value="G4D.5">Geometry & Measurement
              Connection</option>
              <option value="G4D.6">Volume Measurement</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Data Handling" && grade === "G1" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G1E.1">Tally Marks</option>
              <option value="G1E.2">Pictographs</option>
              <option value="G1E.2">Simple Bar Graphs</option>
              <option value="G1E.3">Understanding Data
              Interpretation</option>
              
              
            </select>
           
          </div>
          </>)}

          {topic === "Data Handling" && grade === "G2" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G2E.1">Tally Marks</option>
              <option value="G2E.2">Pictographs</option>
              <option value="G2E.2">Simple Bar Graphs</option>
              <option value="G2E.3">Understanding Data
              Interpretation</option>
              
              
            </select>
           
          </div>
          </>)}

          {topic === "Data Handling" && grade === "G3" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G3E.1">Tally Marks & Pictographs</option>
              <option value="G3E.2">Bar Graphs</option>
              <option value="G3E.3">Understanding Data
              Interpretation</option>
              
              
            </select>
           
          </div>
          </>)}

          {topic === "Data Handling" && grade === "G4" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G4E.1">Collecting and organizing
              data</option>
              <option value="G4E.2">Reading and interpreting bar
              graphs</option>
              <option value="G4E.3">Drawing and labeling bar
              graphs</option>
              <option value="G4E.4">Understanding pie charts</option>
              <option value="G4E.5">Drawing pictographs</option>
              <option value="G4E.6">Using tables to record data</option>
              <option value="G4E.7">Solving word problems using
              data representation</option>
              <option value="G4E.8">Understanding averages
              (mean, mode, median)</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Maths Puzzles" && grade === "G1" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G1F.1">Odd One Out Challenges</option>
              <option value="G1F.2">Visual Puzzles</option>
              <option value="G1F.3">Number Series & Patterns</option>
              <option value="G1F.4">Magic Squares</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Maths Puzzles" && grade === "G2" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G2F.1">Odd One Out Challenges</option>
              <option value="G2F.2">Visual Puzzles</option>
              <option value="G2F.3">Number Series & Patterns</option>
              <option value="G2F.4">Magic Squares</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Maths Puzzles" && grade === "G3" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G3F.1">Odd One Out Challenges</option>
              <option value="G3F.2">Visual Puzzles</option>
              <option value="G3F.3">Patterns</option>
              <option value="G3F.4">Magic Squares</option>
              <option value="G3F.5">Fun Probability & Guessing
              Games</option>
              <option value="G3F.6">Code-Breaking & Math
              Cyphers</option>
              <option value="G3F.7">Math Maze</option>
              <option value="G3F.8">Geometry Shapes/Symmetry</option>
              <option value="G3F.9">Gridlock Challenge</option>
              <option value="G3F.10">Logical Puzzles</option>
              <option value="G3F.11">Riddles</option>
              <option value="G3F.12">Balance the equations</option>
              <option value="G3F.13">Clock and calendar based
              challenges</option>
              <option value="G3F.14">Block Puzzles</option>
              <option value="G3F.15">Others</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Maths Puzzles" && grade === "G4" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G4F.1">Odd One Out Challenges</option>
              <option value="G4F.2">Visual Puzzles</option>
              <option value="G4F.3">Patterns</option>
              <option value="G4F.4">Magic Squares</option>
              <option value="G4F.5">Fun Probability & Guessing
              Games</option>
              <option value="G4F.6">Code-Breaking & Math
              Cyphers</option>
              <option value="G4F.7">Math Maze</option>
              <option value="G4F.8">Geometry Shapes/Symmetry</option>
              <option value="G4F.9">Gridlock Challenge</option>
              <option value="G4F.10">Logical Puzzles</option>
              <option value="G4F.11">Riddles</option>
              <option value="G4F.12">Balance the equations</option>
              <option value="G4F.13">Clock and calendar based
              challenges</option>
              <option value="G4F.14">Block Puzzles</option>
              <option value="G4F.15">Others</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Real Life all concept sums" && grade === "G1" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G1G.1">Geography</option>
              <option value="G1G.2">History</option>
              <option value="G1G.3">Civic Responsibilities</option>
              <option value="G1G.4">Discoveries and Inventions</option>
              <option value="G1G.5">Science</option>
              <option value="G1G.6">Language and Literature</option>
              <option value="G1G.7">Economics</option>
              <option value="G1G.8">Art and Culture</option>
              <option value="G1G.9">Safety</option>
              <option value="G1G.10">Environment</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Real Life all concept sums" && grade === "G2" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G2G.1">Geography</option>
              <option value="G2G.2">History</option>
              <option value="G2G.3">Civic Responsibilities</option>
              <option value="G2G.4">Discoveries and Inventions</option>
              <option value="G2G.5">Science</option>
              <option value="G2G.6">Language and Literature</option>
              <option value="G2G.7">Economics</option>
              <option value="G2G.8">Art and Culture</option>
              <option value="G2G.9">Safety</option>
              <option value="G2G.10">Environment</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Real Life all concept sums" && grade === "G3" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G3G.1">Geography</option>
              <option value="G3G.2">History</option>
              <option value="G3G.3">Civic Responsibilities</option>
              <option value="G3G.4">Discoveries and Inventions</option>
              <option value="G3G.5">Science</option>
              <option value="G3G.6">Language and Literature</option>
              <option value="G3G.7">Economics</option>
              <option value="G3G.8">Art and Culture</option>
              <option value="G3G.9">Safety</option>
              <option value="G3G.10">Environment</option>
              
            </select>
           
          </div>
          </>)}

          {topic === "Real Life all concept sums" && grade === "G4" && (<>
          <div className="formGroup">
          
            <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
              <option value="G4G.1">Geography</option>
              <option value="G4G.2">History</option>
              <option value="G4G.3">Civic Responsibilities</option>
              <option value="G4G.4">Discoveries and Inventions</option>
              <option value="G4G.5">Science</option>
              <option value="G4G.6">Language and Literature</option>
              <option value="G4G.7">Economics</option>
              <option value="G4G.8">Art and Culture</option>
              <option value="G4G.9">Safety</option>
              <option value="G4G.10">Environment</option>
              
            </select>
           
          </div>
          </>)}
          
          <div className="formGroup">
          
            <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="Br">Br</option>
              
              
            </select>
          </div>
          
          
        </>
      )}

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

      {/* Answer Section - only for MCQ and Fill in the Blanks */}
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
      )}

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

export default Upload;