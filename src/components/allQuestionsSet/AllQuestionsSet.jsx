import React, { useEffect, useState, useRef } from "react";
import { database, auth } from "../firebase/FirebaseSetup";
import { ref, get, set, remove } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AllQuestionsSet.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import parse from 'html-react-parser';

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
    if (username.includes('@')) return username;
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
      const questionsWithOrder = Object.entries(setQuestionsData).map(([key, value]) => {
        if (typeof value === 'string') {
          return { id: value, order: 0 };
        } else {
          return {
            id: value.id || key,
            order: value.order || 0
          };
        }
      });

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
    if (!window.confirm("Are you sure you want to remove this question from the set?")) {
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
        if ((typeof value === 'string' && value === questionId) ||
          (typeof value === 'object' && value.id === questionId)) {
          keyToRemove = key;
          break;
        }
      }

      if (!keyToRemove) {
        toast.error("❌ Question not found in set");
        return;
      }

      const questionRef = ref(database, `attachedQuestionSets/${selectedSet}/${keyToRemove}`);
      await remove(questionRef);

      const remainingQuestions = { ...setData };
      delete remainingQuestions[keyToRemove];

      const hasOrderProperty = Object.values(remainingQuestions).some(
        v => typeof v === 'object' && v.order !== undefined
      );

      if (hasOrderProperty) {
        const orderedQuestions = Object.entries(remainingQuestions)
          .map(([key, value]) => ({
            key,
            data: value,
            order: typeof value === 'object' ? (value.order || 0) : 0
          }))
          .sort((a, b) => a.order - b.order);

        const orderUpdatePromises = orderedQuestions.map((item, index) => {
          if (typeof item.data === 'object') {
            const updatedRef = ref(database, `attachedQuestionSets/${selectedSet}/${item.key}`);
            return set(updatedRef, { ...item.data, order: index });
          }
          return Promise.resolve();
        });

        await Promise.all(orderUpdatePromises);
      }

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
          role: "user"
        });
        userKey = userCredential.user.uid;
        toast.success(`✅ New user created with email: ${formattedEmail}`);
      }

      const orderedQuestionIds = questions.map(q => q.id);
      const userSetsRef = ref(database, `users/${userKey}/assignedSets/${selectedSet}`);
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
      const content = pdfContentRef.current;
      
      // First, we need to identify the positions of all questions
      let questionPositions = [];
      
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (doc) => {
          const clonedContent = doc.getElementById('pdf-content');
          if (clonedContent) {
            // Basic styling for PDF
            clonedContent.style.padding = '20px';
            clonedContent.style.background = 'white';
            
            // Hide delete buttons only
            clonedContent.querySelectorAll('.deleteQuestionButton').forEach(btn => {
              btn.style.display = 'none';
            });
            
            // Format answer section with space for writing
            clonedContent.querySelectorAll('.answerText').forEach(answer => {
              answer.style.display = 'block';
              answer.innerHTML = '<h5>Answer:</h5><div style="min-height: 60px; margin-bottom: 20px;"></div>';
            });
            
            // Calculate positions of each question element
            const questionElements = clonedContent.querySelectorAll('.questionsItem');
            questionPositions = Array.from(questionElements).map(el => {
              const rect = el.getBoundingClientRect();
              return {
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height
              };
            });
            
            clonedContent.style.height = 'auto';
            clonedContent.style.overflow = 'visible';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      // Convert question positions to PDF units (mm)
      const questionPositionsMM = questionPositions.map(pos => ({
        top: pos.top * ratio,
        bottom: pos.bottom * ratio,
        height: pos.height * ratio
      }));
      
      // Calculate page breaks that don't split questions
      const pageBreaks = [];
      let currentHeight = 0;
      
      while (currentHeight < scaledHeight) {
        const nextPageBreak = currentHeight + pdfHeight;
        
        // Find any question that would be split by this page break
        const splitQuestionIndex = questionPositionsMM.findIndex(q => 
          q.top < nextPageBreak && q.bottom > nextPageBreak
        );
        
        if (splitQuestionIndex !== -1) {
          // Question would be split, so break at its top instead
          pageBreaks.push(questionPositionsMM[splitQuestionIndex].top);
          currentHeight = questionPositionsMM[splitQuestionIndex].top;
        } else {
          // No split, use regular page break
          pageBreaks.push(nextPageBreak);
          currentHeight = nextPageBreak;
        }
      }
      
      // Generate the PDF with our smart page breaks
      let pageNumber = 1;
      let previousBreak = 0;
      
      for (const pageBreak of pageBreaks) {
        if (pageNumber > 1) {
          pdf.addPage();
        }
        
        // Calculate position adjustment to show the right portion of the image
        const position = previousBreak;
        
        pdf.addImage(
          imgData,
          'PNG',
          0,
          -position,
          scaledWidth,
          scaledHeight
        );
        
        // Add page number
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(
          `Page ${pageNumber}`,
          pdfWidth - 20,
          pdfHeight - 10
        );
        
        previousBreak = pageBreak;
        pageNumber++;
        
        // If we've processed all content, break
        if (pageBreak >= scaledHeight) break;
      }
      
      pdf.save(`${selectedSet.replace(/\s+/g, '_')}_questions.pdf`);
      toast.success("✅ PDF successfully exported");
    } catch (err) {
      console.error("❌ Error exporting PDF:", err);
      toast.error("❌ Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
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
          >
            {questions.length > 0 ? (
              <ul className="questionsList">
                {questions.map((q, index) => (
                  <li key={q.id} className="questionsItem">
                    <div className="questionContent">
                      <div className="questionHeader">
                        <span className="questionNumber">Question {index + 1}</span>
                        <span className="questionType">({q.type})</span>
                        {q.order !== undefined && (
                          <span className="questionOrder">(Order: {q.order})</span>
                        )}
                      </div>

                      <div className="questionText">
                        {isHTML(q.question) ? parse(q.question) : q.question}
                      </div>

                      {q.questionImage && (
                        <div className="questionImage">
                          <img
                            src={q.questionImage}
                            alt="Question Attachment"
                          />
                        </div>
                        
                      )}

                      {q.options && (
                        <ol className="mcqOptions">
                          {q.options.map((option, idx) => (
                            <li key={idx}>{option.text}</li>
                          ))}
                        </ol>
                      )}
                      <div className="answerText">
                        <h5>Answer:</h5>
                      </div>
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
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AllQuestionsSet;