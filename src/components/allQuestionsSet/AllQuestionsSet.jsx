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
import JsBarcode from "jsbarcode";

const generateBarcodeDataUrl = (text) => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format: "CODE128",
    displayValue: false,
    width: 2,
    height: 40,
    margin: 0,
  });
  return canvas.toDataURL("image/png");
};


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

// generate barcode

  const generateBarcodeDataUrl = (text) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: false,
      width: 2,
      height: 40,
      margin: 0,
    });
    return canvas.toDataURL("image/png");
  };
  

  const exportToPDF = async () => {
    if (!selectedSet || !questions.length || !pdfContentRef.current) {
      toast.error("❌ No question set selected or set is empty");
      return;
    }
  
    setExportLoading(true);
  
    try {
      // ✅ Add export mode class before rendering
      pdfContentRef.current.classList.add("pdfExportMode");
  // ✅ Generate barcode image
const barcodeDataUrl = generateBarcodeDataUrl(selectedSet);

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
  
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const headerHeight = 35;
      const footerHeight = 15;
      const usableHeight = pdfHeight - headerHeight - footerHeight;
  
      const questionItems = pdfContentRef.current.querySelectorAll(".questionsItem");
  
      let currentY = headerHeight;
      let currentPage = 1;
  
      for (const item of questionItems) {
        const deleteButtons = item.querySelectorAll(".deleteQuestionButton");
        deleteButtons.forEach((btn) => (btn.style.display = "none"));
  
        const canvas = await html2canvas(item, {
          scale: 4,
          useCORS: true,
          allowTaint: false,
        });
  
        deleteButtons.forEach((btn) => (btn.style.display = ""));
  
        const imgData = canvas.toDataURL("image/jpeg", 0.5);
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth - 2 * margin;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  
        if (currentY + imgHeight > usableHeight + headerHeight) {
          pdf.addPage();
          currentPage++;
          currentY = headerHeight;
        }
  
        if (currentY === headerHeight && currentPage === 1) {
          // Logo on top-left
          
            const logoDisplayWidth = 90; // mm
          const logoAspectRatio = img.width / img.height;
          const logoDisplayHeight = logoDisplayWidth / logoAspectRatio;
          pdf.addImage(logoDataUrl, "JPEG", margin, 10, logoDisplayWidth, logoDisplayHeight);
        
          // Barcode on top-right
           const barcodeWidth = 50; // mm
          const barcodeHeight = 15; // mm
          pdf.addImage(barcodeDataUrl, "PNG", pdfWidth - margin - barcodeWidth, 10, barcodeWidth, barcodeHeight);
        }
        
  
        pdf.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 3;
      }
  
      pdf.save(`${selectedSet}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("❌ Failed to export PDF");
    } finally {
      // ✅ Remove the class after export is done
      pdfContentRef.current.classList.remove("pdfExportMode");
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
          {selectedSet ? `Selected set: "${selectedSet}"` : "Select a question set from below"}
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
<div
  id="pdf-content"
  ref={pdfContentRef}
  className="pdfContent"
  style={{
    backgroundColor: 'white',
    backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.15) 1.5px, transparent 1.5px)',
    backgroundSize: '10px 10px',
    padding: '50px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: '#1a1a1a',
    lineHeight: 1.6,
  }}
>



          {questions.length > 0 ? (
            <ul className="questionsList" style={{ padding: 0, listStyleType: 'none' }}>
              {questions.map((q, index) => {
                const isTrivia = q.type === "TRIVIA";
                const questionNumber = !isTrivia ? getQuestionNumber(questions, index) : null;

                return (
                  <li
                    key={q.id}
                    className={`questionsItem ${isTrivia ? 'triviaItem' : 'questionItem'}`}
                    data-question-type={q.type || "default"}
                    style={{
                      border: '2px solid orange',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                      boxShadow: '0 4px 8px rgba(255, 165, 0, 0.2)',
                    }}
                  >
                    <div className="questionContent">
                      <div className="questionHeader" style={{ marginBottom: '12px' }}>
                        {!isTrivia && (
                          <span
                            className="questionNumber"
                            style={{
                              fontWeight: '700',
                              fontSize: '18px',
                              color: '#d35400',
                              letterSpacing: '1.2px',
                            }}
                          >
                            QUESTION NO: {questionNumber}
                          </span>
                        )}
                      </div>

                      <div
                        className="questionText"
                        style={{
                          fontSize: '16px',
                          color: '#333',
                          marginBottom: '12px',
                          lineHeight: '1.5',
                          fontStyle: 'normal',
                        }}
                      >
                        {isHTML(q.question) ? parse(q.question) : q.question}
                      </div>

                      {q.questionImage && (
                        <div className="questionImage" style={{ marginBottom: '15px' }}>
                          <img
                            src={q.questionImage}
                            alt="Question Attachment"
                            style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }}
                          />
                        </div>
                      )}

                      {q.options && (
                        <ol
                          className="mcqOptions"
                          style={{
                            marginLeft: '20px',
                            color: '#555',
                            fontSize: '15px',
                            marginBottom: '15px',
                          }}
                        >
                          {q.options.map((option, idx) => (
                            <li key={idx} style={{ marginBottom: '8px' }}>
                              {option.text}
                            </li>
                          ))}
                        </ol>
                      )}

                      {!isTrivia && (
                        <div
                          className="answerText"
                          style={{
                            backgroundColor: '#fff3e0',
                            padding: '10px 15px',
                            borderRadius: '10px',
                            color: '#d35400',
                            fontWeight: '600',
                            fontSize: '15px',
                            boxShadow: '0 2px 4px rgba(255, 165, 0, 0.2)',
                          }}
                        >
                          {/* Optional answer content here */}
                        </div>
                      )}
                    </div>

                    {/* Removed delete button from PDF view */}
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
  </div>
);
};
export default AllQuestionsSet;