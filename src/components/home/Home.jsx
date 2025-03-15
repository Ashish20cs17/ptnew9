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
      icon: '📐', 
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
      onClick: () => {/* Navigate to Projects component */}
    },
    { 
      id: 6, 
      title: 'Chat', 
      icon: '💬', 
      onClick: () => {/* Navigate to Chat component */}
    }
  ];

  return (
    <div className="homeContainer p-4 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 ">
        {gridItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="
              h-32
              aspect-square 
              bg-white 
              rounded-lg 
              shadow-md 
              flex 
              flex-col 
              items-center 
              justify-center 

              p-4 
              hover:bg-gray-50 
              transition-all 
              duration-300 
              transform 
              hover:scale-105 
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-500
            "
          >
            <span className="text-4xl mb-2">{item.icon}</span>
            <span className="text-sm font-semibold text-gray-700">{item.title}</span>
          </button>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Home;