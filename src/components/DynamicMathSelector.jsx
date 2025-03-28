import React, { useState } from 'react';

// Centralized data structure
const MATH_DATA = {
  grades: [
    { code: "G1", text: "Grade 1" },
    { code: "G2", text: "Grade 2" },
    { code: "G3", text: "Grade 3" },
    { code: "G4", text: "Grade 4" },
  ],
  topics: [
    // A = Number System
    { grade: "G1", code: "G1A", text: "Number System" },
    { grade: "G2", code: "G2A", text: "Number System" },
    { grade: "G3", code: "G3A", text: "Number System" },
    { grade: "G4", code: "G4A", text: "Number System" },
    // B = Operations
    { grade: "G1", code: "G1B", text: "Operations (Addition, Subtraction ....)" },
    { grade: "G2", code: "G2B", text: "Operations (Addition, Subtraction ....)" },
    { grade: "G3", code: "G3B", text: "Operations (Addition, Subtraction ....)" },
    { grade: "G4", code: "G4B", text: "Operations (Addition, Subtraction ....)" },
    // C = Shapes and Geometry
    { grade: "G1", code: "G1C", text: "Shapes and Geometry" },
    { grade: "G2", code: "G2C", text: "Shapes and Geometry" },
    { grade: "G3", code: "G3C", text: "Shapes and Geometry" },
    { grade: "G4", code: "G4C", text: "Shapes and Geometry" },
    // D = Measurement
    { grade: "G1", code: "G1D", text: "Measurement" },
    { grade: "G2", code: "G2D", text: "Measurement" },
    { grade: "G3", code: "G3D", text: "Measurement" },
    { grade: "G4", code: "G4D", text: "Measurement" },
    // E = Data Handling
    { grade: "G1", code: "G1E", text: "Data Handling" },
    { grade: "G2", code: "G2E", text: "Data Handling" },
    { grade: "G3", code: "G3E", text: "Data Handling" },
    { grade: "G4", code: "G4E", text: "Data Handling" },
    // F = Maths Puzzles
    { grade: "G1", code: "G1F", text: "Maths Puzzles" },
    { grade: "G2", code: "G2F", text: "Maths Puzzles" },
    { grade: "G3", code: "G3F", text: "Maths Puzzles" },
    { grade: "G4", code: "G4F", text: "Maths Puzzles" },
    // G = Real Life all concept sums
    { grade: "G1", code: "G1G", text: "Real Life all concept sums" },
    { grade: "G2", code: "G2G", text: "Real Life all concept sums" },
    { grade: "G3", code: "G3G", text: "Real Life all concept sums" },
    { grade: "G4", code: "G4G", text: "Real Life all concept sums" },
  ],
  subtopics: {
    // Number System
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
    // Operations
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
    // Add other subtopics (G3B, G4B, G1C, G2C, etc.) as needed
    // Example for G4 Operations
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
  },
};

const DynamicMathSelector = () => {
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [topicList, setTopicList] = useState("");

  const handleGradeChange = (e) => {
    setGrade(e.target.value);
    setTopic("");
    setTopicList("");
  };

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
    setTopicList("");
  };

  // Filter topics based on selected grade
  const filteredTopics = MATH_DATA.topics.filter((t) => t.grade === grade);

  return (
    <div>
      {/* Grade Selector */}
      <div className="formGroup">
        <select value={grade} onChange={handleGradeChange}>
          <option value="">Select Grade</option>
          {MATH_DATA.grades.map((g) => (
            <option key={g.code} value={g.code}>
              {g.text}
            </option>
          ))}
        </select>
      </div>

      {/* Topic Selector */}
      {grade && (
        <div className="formGroup">
          <select value={topic} onChange={handleTopicChange}>
            <option value="">Select Topic</option>
            {filteredTopics.map((t) => (
              <option key={t.code} value={t.code}>
                {t.text}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subtopic Selector */}
      {grade && topic && MATH_DATA.subtopics[topic]?.[grade] && (
        <div className="formGroup">
          <select value={topicList} onChange={(e) => setTopicList(e.target.value)}>
            <option value="">Select Subtopic</option>
            {MATH_DATA.subtopics[topic][grade].map((st) => (
              <option key={st.code} value={st.code}>
                {st.text}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Display selected values */}
      {grade && topic && topicList && (
        <div>
          <p>Selected Codes: Grade: {grade}, Topic: {topic}, Subtopic: {topicList}</p>
        </div>
      )}
    </div>
  );
};

export default DynamicMathSelector;