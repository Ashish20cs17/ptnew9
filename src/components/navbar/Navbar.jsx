import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./Navbar.css";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/FirebaseSetup";
import { RxHamburgerMenu } from "react-icons/rx";


const Navbar = () => {
  const [showmenu, setShowmenu] = React.useState(false);
  const navigate = useNavigate(); // ✅ React Router navigation

  const handleHamburger = () => {
    setShowmenu(!showmenu);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user"); // ✅ Clear user data from localStorage
      navigate("/"); // Redirect to login page after logout
      setShowmenu(false); // Close menu after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Function to navigate & close menu
  const handleNavigation = (path) => {
    navigate(path);
    setShowmenu(false); // ✅ Close menu on click
  };

  return (
    <div className="wrapper">
      <h2 onClick={() => handleNavigation("/")}>PracticeTime.ai</h2>

      <nav className={showmenu ? "menu-mobile" : "menu-web"}>
        <ul>
          <li onClick={() => handleNavigation("/upload")}>Add Questions</li>
          <li onClick={() => handleNavigation("/all-questions")} style={{ cursor: "pointer" }}>All Questions</li>
          <li onClick={() => handleNavigation("/attached-questions")}>Attached Questions</li>
          <li onClick={() => handleNavigation("/all-questions-set")}>All Questions set</li>
          <li onClick={() => handleNavigation("/allUsers")}>All Users</li>
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
