import React, { useState,useEffect } from 'react';

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/FirebaseSetup"; // Import auth from firebase.js
import PracticeTime from "../../assets/practiceTime.jpg";
import "./Login.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    // ✅ Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        navigate("/home");
    }
}, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in");
      localStorage.setItem("user",JSON.stringify({
        uid: user.uid,
        email: user.email,})
      )
      navigate("/home");
    } catch (error) {
      console.error("Login failed:", error.message);
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="loginContainer">
      <img src={PracticeTime} alt="Practice Time" className="loginImage" />
      <hr />

      {error && <p className="errorMessage">{error}</p>}

      <input 
        placeholder="Email" 
        type="email" 
        required 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
      />
      <hr />

      <input 
        placeholder="Password" 
        type="password" 
        required 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
      />
      <hr />

      <button id="Login" onClick={handleLogin}>
        Log in
      </button>
    </div>
  );
};

export default Login;
