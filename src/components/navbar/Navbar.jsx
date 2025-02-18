import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./Navbar.css";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/FirebaseSetup";
import practiceTime from "../../assets/practiceTime-removebg-preview.png";
import { RxHamburgerMenu } from "react-icons/rx"
import { set } from 'firebase/database';


const Navbar = () => {

  const [showmenu, setShowmenu] = React.useState(false);
  const handleHamburger = () => {
    setShowmenu(!showmenu);
  }

  const navigate = useNavigate(); // ✅ React Router navigation
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");  // ✅ Clear user data from localStorage
      navigate("/"); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className='wrapper'>
      <h2>PracticeTime.ai</h2>

      <nav className={showmenu ? "menu-mobile" : "menu-web"}>
        <ul>
          {/* ✅ Navigate to /all-questions when clicked */}
          <li onClick={() => {
            navigate('/home');
           
          }}>
            Add Questions
          </li>

          <li onClick={() => {navigate('/all-questions');
          }} style={{ cursor: 'pointer' }}>All Questions</li>
          <li>Attached Questions</li>
          <li onClick={handleLogout}>Log out</li>
        </ul>


      </nav>

      <div className="hamburger">
        <button onClick={handleHamburger}><RxHamburgerMenu /></button>
      </div>
    </div>


  );
};

export default Navbar;
