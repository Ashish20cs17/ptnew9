import React, { useEffect, useState } from "react";
import { database, auth } from "../firebase/FirebaseSetup";
import { ref, get, set, remove } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AllQuestionsSet.css";

const AllQuestionsSet = () => {
  const [questionSets, setQuestionSets] = useState([]);
  const [filteredSets, setFilteredSets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSet, setSelectedSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [attachLoading, setAttachLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Format username to valid email
  const formatEmail = (username) => {
    if (username.includes('@')) return username; // Already an email
    return `${username}@gmail.com`; // Add domain if not present
  };

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  // Effect to filter sets based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSets(questionSets);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = questionSets.filter(([setName]) => 
        setName.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredSets(filtered);
    }
  }, [searchTerm, questionSets]);

  const fetchQuestionSets = async () => {
    try {
      setLoading(true);
      const setsRef = ref(database, "attachedQuestionSets");
      const snapshot = await get(setsRef);

      if (!snapshot.exists()) {
        setQuestionSets([]);
        setFilteredSets([]);
        setError("No question sets found!");
        return;
      }

      const sets = Object.entries(snapshot.val());
      setQuestionSets(sets);
      setFilteredSets(sets);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching question sets:", err);
      setError("Failed to fetch question sets.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetClick = async (setName, setQuestionsData) => {
    setSelectedSet(setName);
    setQuestions([]);
    setLoading(true);
    setError(null);

    try {
      const questionIds = Object.values(setQuestionsData);
      const fetchedQuestions = [];
      const questionPromises = questionIds.map(async (questionId) => {
        const questionRef = ref(database, `questions/${questionId}`);
        const questionSnapshot = await get(questionRef);
        return questionSnapshot.exists()
          ? { id: questionId, ...questionSnapshot.val() }
          : null;
      });

      const results = await Promise.all(questionPromises);
      setQuestions(results.filter(Boolean));
    } catch (err) {
      console.error("❌ Error fetching questions:", err);
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestionSet = async (setName, e) => {
    e.stopPropagation(); // Prevent triggering the set click
    
    if (!window.confirm(`Are you sure you want to delete the set "${setName}"?`)) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      const setRef = ref(database, `attachedQuestionSets/${setName}`);
      await remove(setRef);
      toast.success(`✅ Question set "${setName}" successfully deleted`);
      
      // Update local state
      const updatedSets = questionSets.filter(([name]) => name !== setName);
      setQuestionSets(updatedSets);
      setFilteredSets(updatedSets);
      
      // If the deleted set was the selected one, go back to the list
      if (selectedSet === setName) {
        setSelectedSet(null);
        setQuestions([]);
      }
    } catch (err) {
      console.error("❌ Error deleting question set:", err);
      toast.error("❌ Failed to delete question set");
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteQuestionFromSet = async (questionId) => {
    if (!window.confirm("Are you sure you want to remove this question from the set?")) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      
      // Get current questions in the set
      const setRef = ref(database, `attachedQuestionSets/${selectedSet}`);
      const snapshot = await get(setRef);
      
      if (!snapshot.exists()) {
        toast.error("❌ Set no longer exists");
        return;
      }
      
      const setData = snapshot.val();
      
      // Find the key for this question ID
      const keyToRemove = Object.keys(setData).find(key => setData[key] === questionId);
      
      if (!keyToRemove) {
        toast.error("❌ Question not found in set");
        return;
      }
      
      // Remove the question from the set
      const questionRef = ref(database, `attachedQuestionSets/${selectedSet}/${keyToRemove}`);
      await remove(questionRef);
      
      // Update UI
      setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== questionId));
      toast.success("✅ Question removed from set");
    } catch (err) {
      console.error("❌ Error removing question:", err);
      toast.error("❌ Failed to remove question");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAttachToUser = async () => {
    if (!userEmail.trim()) {
      toast.error("❌ Please enter a username or email!");
      return;
    }
    
    if (!selectedSet) {
      toast.error("❌ Please select a question set first!");
      return;
    }

    setAttachLoading(true);
    
    try {
      const formattedEmail = formatEmail(userEmail.trim());
      
      // Check if user exists
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);
      
      let userKey = null;
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        userKey = Object.keys(users).find(
          (key) => users[key].email === formattedEmail
        );
      }
      
      // If user doesn't exist, create a new one
      if (!userKey) {
        try {
          // Create user with email and default password
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formattedEmail, 
            "123456" // Default password
          );
          
          // Add user to database
          const newUserRef = ref(database, `users/${userCredential.user.uid}`);
          await set(newUserRef, {
            email: formattedEmail,
            createdAt: new Date().toISOString(),
            role: "user"
          });
          
          userKey = userCredential.user.uid;
          toast.success(`✅ New user created with email: ${formattedEmail}`);
        } catch (createError) {
          console.error("❌ Error creating user:", createError);
          toast.error(`❌ Failed to create user: ${createError.message}`);
          setAttachLoading(false);
          return;
        }
      }
      
      // Attach question set to user
      const userSetsRef = ref(database, `users/${userKey}/assignedSets/${selectedSet}`);
      await set(userSetsRef, questions.map(q => q.id));
      toast.success(`✅ Set "${selectedSet}" attached to ${formattedEmail}`);
      setUserEmail("");
    } catch (err) {
      console.error("❌ Error attaching set to user:", err);
      toast.error("❌ Failed to attach set.");
    } finally {
      setAttachLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="allQuestionsContainer">
      <h2>All Question Sets</h2>
      <hr />

      {/* Attach to User Section */}
      <div className="attachToUserSection">
        <h3>Attach Question Set to User</h3>
        <div className="attachForm">
          <input
            type="text"
            placeholder="Enter username or email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <button 
            onClick={handleAttachToUser} 
            disabled={attachLoading || !selectedSet}
            className="attachButton"
          >
            {attachLoading ? "Attaching..." : "Attach Set"}
          </button>
          <div className="hintText">
            {selectedSet ? 
              `Selected set: "${selectedSet}"` : 
              "Select a question set from below"
            }
          </div>
          <div className="noteText">
            Note: If user does not exist, a new account will be created with default password "123456"
          </div>
        </div>
      </div>
      
      <hr />

      {error && <p className="errorMessage">{error}</p>}

      {!selectedSet ? (
        <div className="questionSetsList">
          <h3>Available Question Sets</h3>
          
          {/* Search input field */}
          <div className="searchContainer">
            <input
              type="text"
              placeholder="Search question sets..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="searchInput"
            />
          </div>
          
          {loading ? <p>Loading sets...</p> : null}
          
          {filteredSets.length > 0 ? (
            <ul className="setsList">
              {filteredSets.map(([setName, setQuestionsData]) => (
                <li key={setName} className="setItem">
                  <div 
                    className="setName"
                    onClick={() => handleSetClick(setName, setQuestionsData)}
                  >
                    {setName} ({Object.keys(setQuestionsData).length} questions)
                  </div>
                  <button 
                    className="deleteButton"
                    onClick={(e) => deleteQuestionSet(setName, e)}
                    disabled={deleteLoading}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !loading && 
            <p>
              {searchTerm 
                ? "No matching sets found. Try a different search term." 
                : "No sets available."}
            </p>
          )}
        </div>
      ) : (
        <div className="selectedSetView">
          <div className="setHeader">
            <button onClick={() => setSelectedSet(null)} className="backButton">
              🔙 Back to Sets
            </button>
            <h3>Questions in "{selectedSet}"</h3>
          </div>

          {loading ? <p>Loading questions...</p> : null}

          {questions.length > 0 ? (
            <ul className="questionsList">
              {questions.map((q) => (
                <li key={q.id} className="questionsItem">
                  <div className="questionContent">
                    <strong>{q.question}</strong> 
                    <span className="questionType">({q.type})</span>

                    {q.questionImage && (
                      <div className="questionImage">
                        <img
                          src={q.questionImage}
                          alt="Question Attachment"
                        />
                      </div>
                    )}

                    {q.correctAnswer && (
                      <p className="answerText">
                        <strong>Correct Answer:</strong> {q.correctAnswer.text}
                      </p>
                    )}

                    {q.type === "Fill in the Blanks" && q.answer && (
                      <p className="answerText">
                        <strong>Answer:</strong> {q.answer}
                      </p>
                    )}
                  </div>
                  <button 
                    className="deleteQuestionButton"
                    onClick={() => deleteQuestionFromSet(q.id)}
                    disabled={deleteLoading}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !loading && <p>No questions found in this set.</p>
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AllQuestionsSet;