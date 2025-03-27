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
      // Sort sets alphabetically by setName (the first element of each entry)
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
      // Convert the set data to an array of objects with order information
      const questionsWithOrder = Object.entries(setQuestionsData).map(([key, value]) => {
        // Check if the value is a simple ID string (old format) or an object with order (new format)
        if (typeof value === 'string') {
          // Handle old format (just question IDs)
          return { id: value, order: 0 }; // Default order to 0 for backward compatibility
        } else {
          // Handle new format (objects with order property)
          return {
            id: value.id || key,
            order: value.order || 0
          };
        }
      });

      // Sort by order
      questionsWithOrder.sort((a, b) => a.order - b.order);

      // Now fetch the full question data for each ID
      const fetchedQuestions = [];
      const questionPromises = questionsWithOrder.map(async ({ id, order }) => {
        const questionRef = ref(database, `questions/${id}`);
        const questionSnapshot = await get(questionRef);
        return questionSnapshot.exists()
          ? { id, order, ...questionSnapshot.val() }
          : null;
      });

      const results = await Promise.all(questionPromises);

      // Set the questions in order
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

      // Find the key for this question ID (considering both old and new formats)
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

      // Remove the question from the set
      const questionRef = ref(database, `attachedQuestionSets/${selectedSet}/${keyToRemove}`);
      await remove(questionRef);

      // After removing, we need to update the remaining questions' order if necessary
      // This step is optional but helps keep orders consistent
      const remainingQuestions = { ...setData };
      delete remainingQuestions[keyToRemove];

      // Only reorder if we're using the new format with order properties
      const hasOrderProperty = Object.values(remainingQuestions).some(
        v => typeof v === 'object' && v.order !== undefined
      );

      if (hasOrderProperty) {
        // Convert to array, sort by order, then reassign orders sequentially
        const orderedQuestions = Object.entries(remainingQuestions)
          .map(([key, value]) => ({
            key,
            data: value,
            order: typeof value === 'object' ? (value.order || 0) : 0
          }))
          .sort((a, b) => a.order - b.order);

        // Update each question's order sequentially
        const orderUpdatePromises = orderedQuestions.map((item, index) => {
          if (typeof item.data === 'object') {
            const updatedRef = ref(database, `attachedQuestionSets/${selectedSet}/${item.key}`);
            return set(updatedRef, { ...item.data, order: index });
          }
          return Promise.resolve();
        });

        await Promise.all(orderUpdatePromises);
      }

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

      // Attach question set to user - preserve question order
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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Export the current question set to PDF
  const exportToPDF = async () => {
    if (!selectedSet || !questions.length) {
      toast.error("❌ No question set selected or set is empty");
      return;
    }

    setExportLoading(true);

    try {
      // Create a PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add title
      pdf.setFontSize(22);
      pdf.setTextColor(44, 62, 80);
      pdf.text(`Question Set: ${selectedSet}`, 15, 20);

      // Add date and count
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      pdf.text(`Generated on: ${date}`, 15, 30);
      pdf.text(`Total Questions: ${questions.length}`, 15, 40);
      pdf.line(15, 45, pageWidth - 15, 45);

      // Set starting y position for questions
      let yPosition = 55;
      let pageNumber = 1;

      // Process each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
          pageNumber++;
        }

        // Add question number and type
        pdf.setFontSize(14);
        pdf.setTextColor(44, 62, 80);
        pdf.text(`Question ${i + 1} (${q.type})`, 15, yPosition);
        yPosition += 10;

        // Add question text - handle wrapping
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);

        // Split long text to fit page width
        const questionLines = pdf.splitTextToSize(q.question, pageWidth - 30);
        pdf.text(questionLines, 15, yPosition);
        yPosition += (questionLines.length * 7);

        // Handle image if exists
        if (q.questionImage) {
          try {
            // Add some space before the image
            yPosition += 5;

            // Load the image and convert to data URL
            const imgData = await loadImageAsDataURL(q.questionImage);

            // Calculate dimensions to fit within page width while maintaining aspect ratio
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = pageWidth - 30; // Full width minus margins
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            // Check if image will fit on current page
            if (yPosition + imgHeight > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
              pageNumber++;
            }

            // Add the image
            pdf.addImage(imgData, 'JPEG', 15, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
          } catch (imgError) {
            console.error("Error processing image:", imgError);
            pdf.text("(Error loading image)", 15, yPosition);
            yPosition += 10;
          }
        }

        // Add answer depending on question type
        pdf.setFontSize(12);
        pdf.setTextColor(44, 125, 190);

        if (q.type === "Fill in the Blanks" && q.answer) {
          pdf.text(`Answer: ${q.answer}`, 15, yPosition);
          yPosition += 10;
        } else if (q.correctAnswer) {
          pdf.text(`Correct Answer: ${q.correctAnswer.text}`, 15, yPosition);
          yPosition += 10;
        }

        // Add a separator line between questions
        yPosition += 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 15;
      }

      // Add page numbers
      for (let i = 1; i <= pageNumber; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageNumber}`, pageWidth - 40, pageHeight - 10);
      }

      // Save the PDF
      pdf.save(`${selectedSet.replace(/\s+/g, '_')}_questions.pdf`);
      toast.success("✅ PDF successfully exported");
    } catch (err) {
      console.error("❌ Error exporting PDF:", err);
      toast.error("❌ Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  // Helper function to load an image as a data URL
  const loadImageAsDataURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Handle CORS issues

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        try {
          const dataURL = canvas.toDataURL('image/jpeg');
          resolve(dataURL);
        } catch (e) {
          reject(new Error("Cannot convert image to data URL"));
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  // For creating a visually rich PDF (optional alternative approach)
  const exportToPDFWithCanvas = async () => {
    if (!selectedSet || !questions.length || !pdfContentRef.current) {
      toast.error("❌ No question set selected or set is empty");
      return;
    }

    setExportLoading(true);

    try {
      const content = pdfContentRef.current;
      const canvas = await html2canvas(content, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        onclone: (doc) => {
          // Make visible and adjust styles for better rendering
          const clonedContent = doc.getElementById(content.id);
          if (clonedContent) {
            clonedContent.style.display = 'block';
            clonedContent.querySelectorAll('.deleteQuestionButton').forEach(btn => {
              btn.style.display = 'none';
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Get dimensions to fit to A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      // Add image to cover first page while maintaining aspect ratio
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);

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

            {/* Export to PDF button */}
            <button
              onClick={exportToPDF}
              disabled={exportLoading || !questions.length}
              className="exportButton"
            >
              {exportLoading ? "Exporting..." : "📄 Export to PDF"}
            </button>
          </div>

          {loading ? <p>Loading questions...</p> : null}

          {/* This div will be used to generate PDF content */}
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
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AllQuestionsSet;