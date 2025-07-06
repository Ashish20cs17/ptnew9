import React, { useState, useEffect } from 'react';
import { ref, onValue, get, remove, child } from 'firebase/database';

import { database } from '../firebase/FirebaseSetup';
import './AllUsers.css';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const AllUsers = () => {
const [users, setUsers] = useState([]);
const [filteredUsers, setFilteredUsers] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedUser, setSelectedUser] = useState(null);
const [selectedQuiz, setSelectedQuiz] = useState(null);
const [quizDetails, setQuizDetails] = useState(null);
const [questionDetails, setQuestionDetails] = useState({}); // Store fetched question details
const [selectedQuestionId, setSelectedQuestionId] = useState(null); // Track which question's details to show


// ✅ Strip HTML tags from string
const stripHTML = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
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
      window.open("https://application3-5s7m.onrender.com/", "_blank");
    }}
  >
    Report📄
  </button>
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
