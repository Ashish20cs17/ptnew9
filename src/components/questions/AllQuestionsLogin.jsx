import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AllQuestionsLogin.css"; // 👈 Make sure this file has styles

const AllQuestionsLogin = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const viewerList = [
  { loginId: "1000", password: "admin", grade: "admin" }, // ✅ Admin access
  { loginId: "9873", password: "asd", grade: "Grade 1" },
  { loginId: "4321", password: "maths", grade: "Grade 2" },
    { loginId: "1234", password: "abc", grade: "Grade 3" },
       { loginId: "1000", password: "admin", grade: "Grade 1" },
          { loginId: "1000", password: "admin", grade: "Grade 2" },
             { loginId: "1000", password: "admin", grade: "Grade 3" },
  { loginId: "5678", password: "abc", grade: "G3" },
  { loginId: "1234", password: "abc", grade: "Grade 3" },
];

  const gradeTextToCode = {
    "grade 1": "G1",
    "grade 2": "G2",
    "grade 3": "G3",
    "grade 4": "G4",
    "g1": "G1",
    "g2": "G2",
    "g3": "G3",
    "g4": "G4",
  };

  const handleLogin = () => {
    const found = viewerList.find(
      (v) => v.loginId === loginId && v.password === password
    );

    if (found) {
      const normalizedGrade = gradeTextToCode[found.grade.toLowerCase()] || found.grade;
      const viewerWithNormalizedGrade = { ...found, grade: normalizedGrade };
      localStorage.setItem("viewer", JSON.stringify(viewerWithNormalizedGrade));
      navigate("/all-questions");
    } else {
      setError("Invalid login ID or password!");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>🔐 View Questions Login</h2>
        <input
          type="text"
          placeholder="Login ID"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default AllQuestionsLogin;
