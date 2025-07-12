import React, { useState, useEffect } from 'react';
import { ref, onValue, get, remove, child } from 'firebase/database';

import { database } from '../firebase/FirebaseSetup';
import './AllUsers.css';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";


const AllUsers = () => {
const [users, setUsers] = useState([]);
const [filteredUsers, setFilteredUsers] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedUser, setSelectedUser] = useState(null);
const [selectedQuiz, setSelectedQuiz] = useState(null);
const [quizDetails, setQuizDetails] = useState(null);
const [questionDetails, setQuestionDetails] = useState({}); // Store fetched question details
const [selectedQuestionId, setSelectedQuestionId] = useState(null); // Track which question's details to show
const [studentReport, setStudentReport] = useState('');
const [loadingReport, setLoadingReport] = useState(false);


const [accuracy, setAccuracy] = useState(0);
const [activeReportUserId, setActiveReportUserId] = useState(null);
const [totalQuestions, setTotalQuestions] = useState(0);
const [correctAnswers, setCorrectAnswers] = useState(0);


const [reportData, setReportData] = useState({});
const [selectedPhone, setSelectedPhone] = useState('');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');



// ✅ Strip HTML tags from string
const stripHTML = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};



//download pdf
const downloadReportAsPDF = (userId) => {
  const reportElement = document.getElementById(`report-${userId}`);
  if (!reportElement) return;

  const opt = {
    margin:       0.5,
    filename:     `Report_${userId}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(reportElement).save();
};












const exportAllResponsesForUser = async () => {
  if (!selectedUser || !selectedUser.quizResults) return;

  const allRows = [];

  for (const [quizId, quizData] of Object.entries(selectedUser.quizResults)) {
    for (const response of quizData.responses) {
      const questionId = response.questionId;

      let questionData = questionDetails[questionId];

      // ❗If not already loaded, fetch from Firebase
      if (!questionData) {
   const snapshot = await get(child(ref(database), `questions/${questionId}`));

        if (snapshot.exists()) {
          questionData = snapshot.val();
        } else {
          questionData = {};
        }
      }
allRows.push({
  "Quiz ID": quizId,
  "Question": stripHTML(questionData.question || "N/A"),
  "Your Answer": response.userAnswer,
  "Correct Answer": response.correctAnswer?.text || "N/A",
  "Result": response.isCorrect ? "Correct" : "Incorrect",
  "Difficulty": questionData.difficultyLevel || "N/A",
  "Grade": questionData.grade || "N/A",
  "Topic": questionData.topic || "N/A",
  "Date Added": questionData.date
    ? formatDate(questionData.date)
    : "N/A",
  "Topic List": questionData.topicList || "N/A",
});
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(allRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Responses");

  XLSX.writeFile(workbook, `All_Responses_${selectedUser.email || "user"}.xlsx`);
};


  const exportToExcel = () => {
    if (!quizDetails || !quizDetails.responses) {
      alert("No quiz responses found.");
      return;
    }

    const data = quizDetails.responses.map((response) => {
      const q = questionDetails[response.questionId] || {};
      return {
        "User Email": selectedUser?.email || "N/A",
        "Question": q.question ? q.question.replace(/<[^>]+>/g, '') : "N/A",
        "Your Answer": response.userAnswer,
        "Correct Answer": response.correctAnswer?.text || "N/A",
        "Result": response.isCorrect ? "Correct" : "Incorrect",
        "Type": response.type || "N/A",
        "Difficulty": q.difficultyLevel || "N/A",
        "Grade": q.grade || "N/A",
        "Topic": q.topic || "N/A",
        "Options": q.options ? Object.values(q.options).join(", ") : "N/A",
        "Date Added": q.date ? formatDate(q.date) : "N/A",
        "Topic List": q.topicList || "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Quiz_${selectedQuiz || "unknown"}_Responses.xlsx`);
  };


useEffect(() => {
const usersRef = ref(database, 'users');
onValue(usersRef, (snapshot) => {
const usersData = snapshot.val();
if (usersData) {
const usersArray = Object.keys(usersData).map((key) => ({
id: key,
...usersData[key],
}));
setUsers(usersArray);
setFilteredUsers(usersArray);
}
});
}, []);

useEffect(() => {
if (searchQuery.trim() === '') {
setFilteredUsers(users);
} else {
const query = searchQuery.toLowerCase();
const filtered = users.filter((user) => {
return (
user.id.toLowerCase().includes(query) ||
(user.email && user.email.toLowerCase().includes(query)) ||
(user.role && user.role.toLowerCase().includes(query))
);
});
setFilteredUsers(filtered);
}
}, [searchQuery, users]);

// Fetch question details when a quiz is selected
useEffect(() => {
const fetchQuestionDetails = async () => {
if (!selectedQuiz || !quizDetails?.responses) {
setQuestionDetails({});
return;
}

const responses = quizDetails.responses;
const newQuestionDetails = {};

try {
for (const response of responses) {
const questionId = response.questionId;
const questionPath = `questions/${questionId}`;
const questionRef = ref(database, questionPath);
const snapshot = await get(questionRef);

if (snapshot.exists()) {
newQuestionDetails[questionId] = snapshot.val();
} else {
newQuestionDetails[questionId] = { question: 'Question not found' };
}
}
setQuestionDetails(newQuestionDetails);
} catch (err) {
console.error('Error fetching question details:', err);
setQuestionDetails((prev) => ({
...prev,
[responses[0]?.questionId]: { question: 'Error fetching question' },
}));
}
};

fetchQuestionDetails();
}, [selectedQuiz, quizDetails]);

const handleUserClick = (user) => {
setSelectedUser(user);
setSelectedQuiz(null);
setQuizDetails(null);
setQuestionDetails({});
setSelectedQuestionId(null);
};

const handleQuizClick = async (quizId) => {
if (!selectedUser || !selectedUser.quizResults || !selectedUser.quizResults[quizId]) {
return;
}
setSelectedQuiz(quizId);
setSelectedQuestionId(null);
try {
const quizResultRef = ref(database, `users/${selectedUser.id}/quizResults/${quizId}`);
const snapshot = await get(quizResultRef);
if (snapshot.exists()) {
setQuizDetails(snapshot.val());
} else {
setQuizDetails(null);
}
} catch (error) {
console.error('Error fetching quiz details:', error);
setQuizDetails(null);
}
};

const handleDeleteAssignedSet = async (setId) => {
if (!selectedUser) return;

try {
const setRef = ref(database, `users/${selectedUser.id}/assignedSets/${setId}`);
await remove(setRef);

const updatedUser = {
...selectedUser,
assignedSets: {
...selectedUser.assignedSets,
[setId]: undefined,
},
};
delete updatedUser.assignedSets[setId];
setSelectedUser(updatedUser);

setUsers(users.map((user) => (user.id === selectedUser.id ? updatedUser : user)));
setFilteredUsers(
filteredUsers.map((user) => (user.id === selectedUser.id ? updatedUser : user))
);

alert(`Assigned set ${setId} deleted successfully!`);
} catch (error) {
console.error('Error deleting assigned set:', error);
alert('Failed to delete the assigned set.');
}
};

const formatDate = (dateString) => {
if (!dateString) return 'N/A';
return new Date(dateString).toLocaleString();
};


const handleGenerateReportWithDates = async (userId) => {
  const user = filteredUsers.find(u => u.id === userId);
  if (!user || !startDate || !endDate) {
    alert("Please select user and valid date range.");
    return;
  }

  setLoadingReport(true);

  try {
    const userRef = ref(database, `users/${userId}/quizResults`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      alert("No quiz results found.");
      return;
    }

    const quizResults = snapshot.val();
    const allResponses = [];

    let totalQuestions = 0, correct = 0;
    let fromDate = null, toDate = null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59); // include full day

    for (const [quizId, data] of Object.entries(quizResults)) {
      const completedAt = new Date(data.completedAt);
      if (completedAt < start || completedAt > end) continue;

      const responses = Object.values(data.responses || {});
      totalQuestions += responses.length;
      correct += responses.filter((r) => r.isCorrect).length;

      responses.forEach((res) => {
        allResponses.push({
          topic: res.topic || 'Unknown',
          isCorrect: res.isCorrect,
        });
      });

      if (!fromDate || completedAt < fromDate) fromDate = completedAt;
      if (!toDate || completedAt > toDate) toDate = completedAt;
    }

    const wrong = totalQuestions - correct;
    const accuracy = totalQuestions ? ((correct / totalQuestions) * 100).toFixed(1) : 0;
    setAccuracy(accuracy);
    setReportData({ totalQuestions, correct, wrong, accuracy });

    const topics = [...new Set(allResponses.map(r => r.topic))].filter(t => t !== 'Unknown');

    const prompt = `
# Student Performance Analysis
**Duration:** ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}


Performance Metrics:
- Total Questions: ${totalQuestions}
- Correct Answers: ${correct}
- Wrong Answers: ${wrong}
- Accuracy: ${accuracy}%

Topics Covered:
${topics.length ? topics.join(', ') : 'Not available'}

Analyze this and give:
- Short summary
- Strengths
- Weaknesses
- Improvement plan
Write in clear, structured format with headings.
    `;
const geminiResponse = await fetch("https://gemini-backend-odux.onrender.com/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const { reportText } = await geminiResponse.json();
    setStudentReport(reportText);
    setActiveReportUserId(userId);

  } catch (error) {
    console.error("Error generating filtered report:", error);
    alert("Failed to generate report.");
  } finally {
    setLoadingReport(false);
  }
};



const handleGenerateReport = async (user) => {
  setLoadingReport(true);
  try {
    const userRef = ref(database, `users/${user.id}/quizResults`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      alert("No quiz results found.");
      return;
    }

    const quizResults = snapshot.val();
    const allResponses = [];

    let totalQuestions = 0, correct = 0;
    let fromDate = null, toDate = null;

    for (const [quizId, data] of Object.entries(quizResults)) {
      const responses = Object.values(data.responses || {});
      totalQuestions += responses.length;
      correct += responses.filter((r) => r.isCorrect).length;

      responses.forEach((res) => {
        allResponses.push({
          topic: res.topic || 'Unknown',
          isCorrect: res.isCorrect,
        });
      });

      const date = new Date(data.completedAt);
      if (!fromDate || date < fromDate) fromDate = date;
      if (!toDate || date > toDate) toDate = date;
    }

    const wrong = totalQuestions - correct;
 const calculatedAccuracy = totalQuestions ? ((correct / totalQuestions) * 100).toFixed(1) : 0;
setReportData({
  totalQuestions,
  correct,
  wrong,
  accuracy: calculatedAccuracy,
});



    // Collect topics
    const topics = [...new Set(allResponses.map(r => r.topic))].filter(t => t !== 'Unknown');

   const prompt = `
Student Performance Report
Performance Metrics:
- Total Activities: ${totalQuestions}
- Overall Accuracy: ${calculatedAccuracy}%
- Total Questions: ${totalQuestions}
- Correct Answers: ${correct}
- Wrong Answers: ${wrong}

Duration: ${fromDate?.toLocaleDateString() || 'N/A'} - ${toDate?.toLocaleDateString() || 'N/A'}

Topics Covered:
${topics.length ? topics.join(', ') : 'Not available'}

Analyze this data and give:
- A short summary
- Strengths (topics where most answers are correct)
- Weaknesses (topics with frequent mistakes)
- An improvement plan with action points
Write in a clean report format with clear headings and spacing. Be helpful and encouraging.
`;

   const geminiResponse = await fetch("https://gemini-backend-odux.onrender.com/api/gemini",{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const { reportText } = await geminiResponse.json();
    setStudentReport(reportText);
setActiveReportUserId(user.id); // 👈 Set the current user's ID for whom report is active


  } catch (error) {
    console.error("Error generating report:", error);
    alert("Failed to generate report.");
  } finally {
    setLoadingReport(false);
  }
};























// Sort quiz results by completedAt date (latest first)
const sortedQuizResults = selectedUser?.quizResults
? Object.keys(selectedUser.quizResults).sort((quizIdA, quizIdB) => {
const quizA = selectedUser.quizResults[quizIdA];
const quizB = selectedUser.quizResults[quizIdB];
return new Date(quizB.completedAt) - new Date(quizA.completedAt);
})
: [];

// <<< Add your assignedSets sorting here >>>
const sortedAssignedSetIds = Object.keys(selectedUser?.assignedSets || {}).sort((a, b) => {
const dateA = new Date(
a.substring(0, 4) + '-' + a.substring(4, 6) + '-' + a.substring(6, 8)
);
const dateB = new Date(
b.substring(0, 4) + '-' + b.substring(4, 6) + '-' + b.substring(6, 8)
);
return dateB - dateA;
});
function parseDateFromSetId(setId) {
if (!setId || setId.length < 8) return null;
const year = setId.substring(0, 4);
const month = setId.substring(4, 6);
const day = setId.substring(6, 8);
const dateObj = new Date(`${year}-${month}-${day}`);
return isNaN(dateObj) ? null : dateObj;
}

return (
<div className="users-container">
<h1 className="page-title">User Management</h1>

<div className="search-container">
<span className="search-icon">
<svg
xmlns="http://www.w3.org/2000/svg"
width="18"
height="18"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
strokeWidth="2"
strokeLinecap="round"
strokeLinejoin="round"
>
<circle cx="11" cy="11" r="8"></circle>
<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
</svg>
</span>
<input
type="text"
placeholder="Search users by ID, email, or role..."
className="search-input"
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
/>
</div>




























<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '20px 0' }}>
  <select
    value={selectedPhone}
    onChange={(e) => setSelectedPhone(e.target.value)}
    style={{ padding: '6px', minWidth: '200px' }}
  >
    <option value="">📱 Select Phone/User</option>
    {filteredUsers.map((u) => (
      <option key={u.id} value={u.id}>
        {u.phone || u.email}
      </option>
    ))}
  </select>

  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    style={{ padding: '6px' }}
  />
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    style={{ padding: '6px' }}
  />

  <button
    onClick={() => handleGenerateReportWithDates(selectedPhone)}
    style={{
      padding: '6px 12px',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
    }}
  >
    📊 Generate Report
  </button>
</div>
















<div className="content-layout">
<div className="users-list-container">
<div className="panel-header">
<h2 className="panel-title">Users</h2>
<span className="user-count">{filteredUsers.length}</span>
</div>
{filteredUsers.length === 0 ? (
<div className="empty-message">No users found</div>
) : (
<ul className="users-list">
  {filteredUsers.map((user, index) => (
    <li
      key={user.id}
      className={`user-item ${
        selectedUser && selectedUser.id === user.id ? 'selected' : ''
      }`}
      style={{ '--index': index }}
    >
<div className="user-email-row">
  <span className="user-email-text">{user.email || 'No email'}</span>
<button
  className="report-button"
  onClick={(e) => {
    e.stopPropagation();
    handleGenerateReport(user); // 🔥 Trigger report generation
  }}
>
  Report📄
</button>



{activeReportUserId === user.id && studentReport && (
  <div
    className="student-report-container"
    id={`report-${user.id}`} // ✅ Important for PDF/download
    style={{
      background: '#fff',
      padding: '30px',
      marginTop: '20px',
      borderRadius: '10px',
      border: '1px solid #ccc',
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1.6,
      color: '#333',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      maxWidth: '800px'
    }}
  >
    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>📄 Student Performance Report</h2>

    <section style={{ marginBottom: '20px' }}>
      <h3>👤 Student Info</h3>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>User ID:</strong> {user.id}</p>
    </section>

    <section style={{ marginBottom: '20px' }}>
      <h3>📊 Performance Metrics</h3>
      <ul>
       <li><strong>Total Questions:</strong> {reportData.totalQuestions}</li>
<li><strong>Correct Answers:</strong> {reportData.correct}</li>
<li><strong>Wrong Answers:</strong> {reportData.wrong}</li>
<li><strong>Overall Accuracy:</strong> {reportData.accuracy}%</li>

      </ul>

      {/* Visualization */}
      <div style={{ marginTop: '10px' }}>
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#eee',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '5px'
        }}>
          <div style={{
            width: `${accuracy}%`,
            height: '100%',
            backgroundColor: 'green',
            float: 'left'
          }}></div>
          <div style={{
            width: `${100 - accuracy}%`,
            height: '100%',
            backgroundColor: 'red',
            float: 'left'
          }}></div>
        </div>
        <p>✔️ Correct: {accuracy}% | ❌ Wrong: {100 - accuracy}%</p>
      </div>
    </section>

    <section style={{ marginBottom: '20px' }}>
      <h3>🧠 Performance Analysis</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{studentReport}</pre>
    </section>

    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
      <button onClick={() => setActiveReportUserId(null)}>❌ Close</button>
      <button onClick={() => downloadReportAsPDF(user.id)}>⬇️ Download PDF</button>
    </div>
  </div>
)}





















</div>


      <div
        className="user-meta"
        onClick={() => handleUserClick(user)}
      >
        <span>ID: {user.id.substring(0, 10)}...</span>
        <span>Role: {user.role || 'N/A'}</span>
      </div>
    </li>
  ))}
</ul>

)}
</div>

<div className="user-details-container">
<div className="panel-header">
<h2 className="panel-title">
{selectedQuiz ? `Quiz Results: ${selectedQuiz}` : 'User Details'}
</h2>


{selectedUser && selectedUser.quizResults && (
  <button
    className="excel-download-btn"
    onClick={exportAllResponsesForUser}
  >
    📥 Download All Responses for {selectedUser.email}
  </button>
)}


{selectedQuiz && (
<button
className="back-button"
onClick={() => {
setSelectedQuiz(null);
setQuizDetails(null);
setQuestionDetails({});
setSelectedQuestionId(null);
}}
>
Back to User
</button>
)}
</div>

<div className="panel-content">
{selectedUser && !selectedQuiz ? (
<div>
<div className="detail-section">
<div className="detail-field">
<div className="field-label">ID:</div>
<div className="field-value">{selectedUser.id}</div>
</div>
<div className="detail-field">
<div className="field-label">Email:</div>
<div className="field-value">{selectedUser.email || 'N/A'}</div>
</div>
<div className="detail-field">
<div className="field-label">Role:</div>
<div className="field-value">{selectedUser.role || 'N/A'}</div>
</div>
<div className="detail-field">
<div className="field-label">Created At:</div>
<div className="field-value">{formatDate(selectedUser.createdAt)}</div>
</div>
</div>

{selectedUser.quizResults &&
Object.keys(selectedUser.quizResults).length > 0 && (
<div className="detail-section">
<h3 className="subsection-title">Quiz Results</h3>
<ul className="item-list interactive">
{sortedQuizResults.map((quizId) => (
<li
key={quizId}
onClick={() => handleQuizClick(quizId)}
className="clickable"
>
<div className="quiz-result-summary">
<span className="quiz-id">{quizId}</span>
<span className="view-details">View Details</span>
</div>
</li>
))}
</ul>
</div>
)}
{selectedUser.assignedSets &&
Object.entries(selectedUser.assignedSets)
.sort(([, a], [, b]) => {
const dateA = a?.attachedAt ? new Date(a.attachedAt) : new Date(0);
const dateB = b?.attachedAt ? new Date(b.attachedAt) : new Date(0);
return dateB - dateA;
})
.map(([setId, data]) => {
// Use attachedAt if available
let date = data?.attachedAt ? new Date(data.attachedAt) : null;

// If no attachedAt, parse date from setId like "20250318_Grade4"
if (!date) {
const match = setId.match(/^(\d{4})(\d{2})(\d{2})/);
if (match) {
const [_, year, month, day] = match;
// Default time 09:00 AM (adjust if you want)
date = new Date(`${year}-${month}-${day}T09:00:00`);
}
}

const formattedDate = date
? date.toLocaleString('en-GB', {
day: '2-digit',
month: '2-digit',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
hour12: true,
})
: 'No Date';

return (
<li key={setId} className="assigned-set-item">
<span>
{setId} {' - '}
<small style={{ color: '#666', fontSize: '0.8em' }}>
{formattedDate}
</small>
</span>
<button
className="delete-button1"
onClick={() => handleDeleteAssignedSet(setId)}
>
Delete
</button>
</li>
);
})}


</div>
) : selectedQuiz && quizDetails ? (
<div className="quiz-details">
<div className="detail-section">
<div className="detail-field">
<div className="field-label">Quiz ID:</div>
<div className="field-value">{selectedQuiz}</div>
</div>
<div className="detail-field">
<div className="field-label">Completed At:</div>
<div className="field-value">{formatDate(quizDetails.completedAt)}</div>
</div>
<div className="detail-field">
<div className="field-label">Score:</div>
<div className="field-value">{quizDetails.score}</div>
</div>
<div className="detail-field">
<div className="field-label">Correct Answers:</div>
<div className="field-value">{quizDetails.correctAnswers}</div>
</div>
<div className="detail-field">
<div className="field-label">Total Questions:</div>
<div className="field-value">{quizDetails.totalQuestions}</div>
</div>
<div className="detail-field">
<div className="field-label">Selected Set:</div>
<div className="field-value">{quizDetails.selectedSet}</div>
</div>
</div>

{quizDetails.responses && (
<div className="detail-section">
<h3 className="subsection-title">Responses</h3>




<div style={{ display: 'flex', justifyContent: 'center' }}>
  <button onClick={exportToExcel} className="excel-download-btn">
    📥 Download Responses as Excel
  </button>
</div>


<table className="responses-table">
<thead>
  <tr>
    <th>User Email</th>
    <th>Question</th>
    <th>Your Answer</th>
    <th>Correct Answer</th>
    <th>Result</th>
    <th>Type</th>
    <th>Difficulty</th>
    <th>Grade</th>
    <th>Topic</th>
    <th>Options</th>
    <th>Date Added</th>
    <th>Topic List</th>
  </tr>
</thead>

<tbody>
  {quizDetails.responses.map((response, index) => {
    const questionData = questionDetails[response.questionId] || {};

    return (
      <tr key={index}>
        <td>{selectedUser.email || 'N/A'}</td> {/* <-- USER EMAIL */}
        <td>
          {questionData.question ? (
            <div
              dangerouslySetInnerHTML={{
                __html: questionData.question,
              }}
            />
          ) : (
            'Loading...'
          )}
        </td>
        <td>{response.userAnswer}</td>
        <td>{response.correctAnswer.text}</td>
        <td
          style={{
            color: response.isCorrect ? 'green' : 'red',
          }}
        >
          {response.isCorrect ? 'Correct' : 'Incorrect'}
        </td>
        <td>{response.type || 'N/A'}</td>
        <td>{questionData.difficultyLevel || 'N/A'}</td>
        <td>{questionData.grade || 'N/A'}</td>
        <td>{questionData.topic || 'N/A'}</td>
        <td>
          {questionData.options
            ? Object.values(questionData.options).join(', ')
            : 'N/A'}
        </td>
        <td>
          {questionData.date
            ? formatDate(questionData.date)
            : 'N/A'}
        </td>
        <td>{questionData.topicList || 'N/A'}</td>
      </tr>
    );
  })}
</tbody>


</table>
</div>
)}
</div>
) : selectedQuiz ? (
<div className="empty-message">Loading quiz details...</div>
) : (
<div className="empty-message">Select a user to view details</div>
)}
</div>
</div>
</div>
</div>
);
};

export default AllUsers;
