import React, { useEffect, useState, useRef } from "react";
import { database, auth } from "../firebase/FirebaseSetup";
import { ref, get, set, remove } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AllQuestionsSet.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import parse from "html-react-parser";
import practiceTime from "../../assets/practiceTime.jpg";

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
  const [exportLoading, setExportLoading] = useState(false);

  const pdfContentRef = useRef(null);

  const formatEmail = (username) => {
    if (username.includes("@")) return username;
    return `${username}@gmail.com`;
  };

  useEffect(() => {
    fetchQuestionSets();
  }, []);

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
      const sortedSets = sets.sort(([setNameA], [setNameB]) =>
        setNameB.localeCompare(setNameA)
      );
      setQuestionSets(sortedSets);
      setFilteredSets(sortedSets);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching question sets:", err);
      setError("Failed to fetch question sets.");
    } finally {
      setLoading(false);
    }
  };

  const isHTML = (str) => {
    return /<[^>]+>/.test(str);
  };

  const handleSetClick = async (setName, setQuestionsData) => {
    setSelectedSet(setName);
    setQuestions([]);
    setLoading(true);
    setError(null);

    try {
      const questionsWithOrder = Object.entries(setQuestionsData).map(
        ([key, value]) => {
          if (typeof value === "string") {
            return { id: value, order: 0 };
          } else {
            return {
              id: value.id || key,
              order: value.order || 0,
            };
          }
        }
      );

      questionsWithOrder.sort((a, b) => a.order - b.order);

      const fetchedQuestions = [];
      const questionPromises = questionsWithOrder.map(async ({ id, order }) => {
        const questionRef = ref(database, `questions/${id}`);
        const questionSnapshot = await get(questionRef);
        return questionSnapshot.exists()
          ? { id, order, ...questionSnapshot.val() }
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
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the set "${setName}"?`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      const setRef = ref(database, `attachedQuestionSets/${setName}`);
      await remove(setRef);
      toast.success(`✅ Question set "${setName}" successfully deleted`);

      const updatedSets = questionSets.filter(([name]) => name !== setName);
      setQuestionSets(updatedSets);
      setFilteredSets(updatedSets);

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
    if (
      !window.confirm("Are you sure you want to remove this question from the set?")
    ) {
      return;
    }

    try {
      setDeleteLoading(true);
      const setRef = ref(database, `attachedQuestionSets/${selectedSet}`);
      const snapshot = await get(setRef);

      if (!snapshot.exists()) {
        toast.error("❌ Set no longer exists");
        return;
      }

      const setData = snapshot.val();
      let keyToRemove = null;
      for (const [key, value] of Object.entries(setData)) {
        if (
          (typeof value === "string" && value === questionId) ||
          (typeof value === "object" && value.id === questionId)
        ) {
          keyToRemove = key;
          break;
        }
      }

      if (!keyToRemove) {
        toast.error("❌ Question not found in set");
        return;
      }

      const questionRef = ref(
        database,
        `attachedQuestionSets/${selectedSet}/${keyToRemove}`
      );
      await remove(questionRef);

      const remainingQuestions = { ...setData };
      delete remainingQuestions[keyToRemove];

      const hasOrderProperty = Object.values(remainingQuestions).some(
        (v) => typeof v === "object" && v.order !== undefined
      );

      if (hasOrderProperty) {
        const orderedQuestions = Object.entries(remainingQuestions)
          .map(([key, value]) => ({
            key,
            data: value,
            order: typeof value === "object" ? value.order || 0 : 0,
          }))
          .sort((a, b) => a.order - b.order);

        const orderUpdatePromises = orderedQuestions.map((item, index) => {
          if (typeof item.data === "object") {
            const updatedRef = ref(
              database,
              `attachedQuestionSets/${selectedSet}/${item.key}`
            );
            return set(updatedRef, { ...item.data, order: index });
          }
          return Promise.resolve();
        });

        await Promise.all(orderUpdatePromises);
      }

      setQuestions((prevQuestions) =>
        prevQuestions.filter((q) => q.id !== questionId)
      );
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
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);

      let userKey = null;
      if (snapshot.exists()) {
        const users = snapshot.val();
        userKey = Object.keys(users).find(
          (key) => users[key].email === formattedEmail
        );
      }

      if (!userKey) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formattedEmail,
          "123456"
        );
        const newUserRef = ref(database, `users/${userCredential.user.uid}`);
        await set(newUserRef, {
          email: formattedEmail,
          createdAt: new Date().toISOString(),
          role: "user",
        });
        userKey = userCredential.user.uid;
        toast.success(`✅ New user created with email: ${formattedEmail}`);
      }

      const orderedQuestionIds = questions.map((q) => q.id);
      const userSetsRef = ref(
        database,
        `users/${userKey}/assignedSets/${selectedSet}`
      );
      await set(userSetsRef, orderedQuestionIds);
      toast.success(`✅ Set "${selectedSet}" attached to ${formattedEmail}`);
      setUserEmail("");
    } catch (err) {
      console.error("❌ Error attaching set to user:", err);
      toast.error("❌ Failed to attach set.");
    } finally {
      setAttachLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const exportToPDF = async () => {
    if (!selectedSet || !questions.length || !pdfContentRef.current) {
      toast.error("❌ No question set selected or set is empty");
      return;
    }
  
    setExportLoading(true);
  
    try {
      // Convert logo to data URL
      const img = new Image();
      img.src = practiceTime;
  
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
  
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const logoDataUrl = tempCanvas.toDataURL("image/jpeg");
  
      // Initialize PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // Left and right margin
      const maxContentWidth = pdfWidth - 2 * margin; // Usable width
      const headerHeight = 35; // Space for header
      const footerHeight = 15; // Space for footer (page number)
  
      // Get each question element separately
      const questionItems = pdfContentRef.current.querySelectorAll(".questionsItem");
  
      let currentPage = 1;
      let currentY = headerHeight; // Start after header
  
      // Calculate a consistent scale factor based on reasonable width
      // Instead of using the widest question, use a fixed percentage of the max content width
      // This helps with text wrapping behavior
      const contentWidthPx = 600; // Reasonable base width in pixels
      const consistentScaleFactor = maxContentWidth / contentWidthPx;
  
      for (let i = 0; i < questionItems.length; i++) {
        const questionItem = questionItems[i];
  
        // Create a clone of the question for capture
        const questionClone = questionItem.cloneNode(true);
  
        // Remove delete buttons and apply styling
        const deleteBtn = questionClone.querySelector(".deleteQuestionButton");
        if (deleteBtn) {
          deleteBtn.style.display = "none";
        }
  
        // Create a temporary container with fixed width to enforce wrapping
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.width = `${contentWidthPx}px`;
        document.body.appendChild(tempContainer);
  
        // Apply enhanced styles to ensure proper text wrapping
        questionClone.style.background = "white";
        questionClone.style.padding = "10px";
        questionClone.style.margin = "0";
        questionClone.style.border = "none";
        questionClone.style.width = "100%"; // Take full width of container
        questionClone.style.boxSizing = "border-box";
        questionClone.style.wordWrap = "break-word";
        questionClone.style.overflowWrap = "break-word";
        questionClone.style.whiteSpace = "normal";
        questionClone.style.position = "relative";
        questionClone.style.display = "block";
  
        // Ensure all child elements respect width and have proper text wrapping
        const allElements = questionClone.querySelectorAll("*");
        allElements.forEach((el) => {
          el.style.maxWidth = "100%";
          el.style.wordWrap = "break-word";
          el.style.overflowWrap = "break-word";
          el.style.whiteSpace = "normal";
          
          // Force paragraphs and text elements to wrap
          if (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'SPAN' || 
              el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || 
              el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6') {
            el.style.width = "100%";
            el.style.display = "block";
          }
        });
  
        // Append to the temporary container
        tempContainer.appendChild(questionClone);
  
        // Capture this single question with fixed width to enforce wrapping
        const questionCanvas = await html2canvas(questionClone, {
          scale: 2, // High resolution
          useCORS: true,
          logging: false,
          width: contentWidthPx, // Fixed capture width
          onclone: (clonedDoc) => {
            // Additional opportunity to style the clone before capture
            const clone = clonedDoc.body.querySelector(questionClone.tagName);
            if (clone) {
              // Force line breaks on long text
              const textNodes = Array.from(clone.querySelectorAll('*'))
                .filter(node => node.childNodes.length > 0 && 
                      (node.textContent || '').length > 50);
              
              textNodes.forEach(node => {
                node.style.width = "100%";
                node.style.wordBreak = "break-word"; // Added for extra wrapping control
              });
            }
          }
        });
  
        // Convert to image data
        const questionImgData = questionCanvas.toDataURL("image/png");
  
        // Calculate scaled dimensions for PDF
        const qScaledWidth = maxContentWidth;
        const aspectRatio = questionCanvas.height / questionCanvas.width;
        const qScaledHeight = qScaledWidth * aspectRatio;
  
        // Check if question fits on current page
        if (currentY + qScaledHeight > pdfHeight - footerHeight - margin) {
          // Add new page
          pdf.addPage();
          currentPage++;
          currentY = headerHeight; // Reset Y position after header
          addHeaderToPage(pdf, logoDataUrl, selectedSet, pdfWidth);
        }
  
        // Add this question to the PDF
        pdf.addImage(questionImgData, "PNG", margin, currentY, qScaledWidth, qScaledHeight);
  
        // Move Y position for next question
        currentY += qScaledHeight + 10; // Add spacing between questions
  
        // Clean up
        document.body.removeChild(tempContainer);
  
        // Add header to first page (or current page if it's the first iteration)
        if (i === 0) {
          addHeaderToPage(pdf, logoDataUrl, selectedSet, pdfWidth);
        }
  
        // Add page number
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(`Page ${currentPage}`, pdfWidth - margin, pdfHeight - 5);
      }
  
      // Helper function to add header to page
      function addHeaderToPage(pdf, logoUrl, title, width) {
        pdf.addImage(logoUrl, "JPEG", margin, 5, 70, 10);
  
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        // pdf.text(title, margin + 35, 18); // Uncomment if title is needed
  
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.line(margin, 28, width - margin, 28);
      }
  
      pdf.save(`${selectedSet.replace(/\s+/g, "_")}_questions.pdf`);
      toast.success("✅ PDF successfully exported");
    } catch (err) {
      console.error("❌ Error exporting PDF:", err);
      toast.error("❌ Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  // Function to get question number, only counting non-trivia questions
  const getQuestionNumber = (questions, currentIndex) => {
    if (!questions || currentIndex < 0) return 0;
    
    // Count non-trivia questions up to currentIndex
    return questions
      .slice(0, currentIndex + 1)
      .filter(q => q.type !== "TRIVIA")
      .length;
  };

  return (
    <div className="allQuestionsContainer">
      <h2>All Question Sets</h2>
      <hr />

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
            {selectedSet
              ? `Selected set: "${selectedSet}"`
              : "Select a question set from below"}
          </div>
          <div className="noteText">
            Note: If user does not exist, a new account will be created with default
            password "123456"
          </div>
        </div>
      </div>

      <hr />

      {error && <p className="errorMessage">{error}</p>}

      {!selectedSet ? (
        <div className="questionSetsList">
          <h3>Available Question Sets</h3>
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
            !loading && (
              <p>
                {searchTerm
                  ? "No matching sets found. Try a different search term."
                  : "No sets available."}
              </p>
            )
          )}
        </div>
      ) : (
        <div className="selectedSetView">
          <div className="setHeader">
            <button onClick={() => setSelectedSet(null)} className="backButton">
              🔙 Back to Sets
            </button>
            <h3>Questions in "{selectedSet}"</h3>
            <button
              onClick={exportToPDF}
              disabled={exportLoading || !questions.length}
              className="exportButton"
            >
              {exportLoading ? "Exporting..." : "📄 Export to PDF"}
            </button>
          </div>

          {loading ? <p>Loading questions...</p> : null}

          <div id="pdf-content" ref={pdfContentRef} className="pdfContent">
            {questions.length > 0 ? (
              <ul className="questionsList">
                {questions.map((q, index) => {
                  const isTrivia = q.type === "TRIVIA";
                  const questionNumber = !isTrivia ? getQuestionNumber(questions, index) : null;
                  
                  return (
                    <li
                      key={q.id}
                      className={`questionsItem ${isTrivia ? 'triviaItem' : 'questionItem'}`}
                      data-question-type={q.type || "default"}
                    >
                      <div className="questionContent">
                        <div className="questionHeader">
                          {isTrivia ? (
                            <span className="triviaLabel"></span>
                          ) : (
                            <span className="questionNumber">Question {questionNumber}</span>
                          )}
                        </div>

                        <div className="questionText">
                          {isHTML(q.question) ? parse(q.question) : q.question}
                        </div>

                        {q.questionImage && (
                          <div className="questionImage">
                            <img src={q.questionImage} alt="Question Attachment" />
                          </div>
                        )}

                        {q.options && (
                          <ol className="mcqOptions">
                            {q.options.map((option, idx) => (
                              <li key={idx}>{option.text}</li>
                            ))}
                          </ol>
                        )}

                        {!isTrivia && (
                          <div className="answerText">
                            <h5>Answer:</h5>
                          </div>
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
                  );
                })}
              </ul>
            ) : (
              !loading && <p>No questions found in this set.</p>
            )}
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AllQuestionsSet;