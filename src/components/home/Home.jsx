import React from 'react';
import { database } from "../firebase/FirebaseSetup";
import { ref, push, set, serverTimestamp } from "firebase/database";
import supabase from "../supabase/SupabaseConfig";
import { ToastContainer, toast } from "react-toastify";
import "./Home.css";
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate(); // ✅ React Router navigation
  
  // Sample grid items - you can modify these as needed
  const gridItems = [
    {
      id: 1,
      title: 'Upload Questions',
      icon: '⬆️',
      onClick: () => {navigate("/upload")} // ✅ Navigate to Home component
    },
    {
      id: 2,
      title: 'All Questions',
      icon: '📜',
      onClick: () => {navigate("/all-questions")} // ✅ Navigate to AllQuestions component
    },
    {
      id: 3,
      title: 'Attached Questions',
      icon: '🔖',
      onClick: () => {navigate("/attached-questions")} // ✅ Navigate to AttachedQuestions component
    },
    {
      id: 4,
      title: 'All Questions Set',
      icon: '📑',
      onClick: () => {navigate("/all-questions-set")} // ✅ Navigate to AllQuestionsSet component
    },
    {
      id: 5,
      title: 'All Users',
      icon: '👥',
      onClick: () => {navigate("/allUsers")}
    },
    {
      id: 6,
      title: 'Offline Users',
      icon: '👤',
      onClick: () => {navigate("/offlineUsers")}
    }
  ];
  
  return (
    <div className="homeContainer">
      <div className="grid-container">
        {gridItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="grid-item"
          >
            <span className="grid-icon">{item.icon}</span>
            <span className="grid-title">{item.title}</span>
          </button>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Home;