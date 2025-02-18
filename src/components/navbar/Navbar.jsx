import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./Navbar.css";
import { signOut } from "firebase/auth";
import {auth} from "../firebase/FirebaseSetup";


const Navbar = () => {
    
  const navigate = useNavigate(); // ✅ React Router navigation
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className='wrapper'>
      <div className="navContainer">
        <ul>
          {/* ✅ Navigate to /all-questions when clicked */}
          <li onClick={() => navigate('/all-questions')} style={{ cursor: 'pointer' }}>All Questions</li>
          <li>Attached Questions</li>
        </ul>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </div>
  );
};

export default Navbar;
