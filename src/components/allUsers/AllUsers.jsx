import React, { useState, useEffect } from 'react';
import { ref, onValue, get, remove } from 'firebase/database'; // Add 'remove' import
import { database } from '../firebase/FirebaseSetup';
import './AllUsers.css';

const AllUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizDetails, setQuizDetails] = useState(null);

    useEffect(() => {
        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const usersArray = Object.keys(usersData).map(key => ({
                    id: key,
                    ...usersData[key]
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
            const filtered = users.filter(user => {
                return (
                    user.id.toLowerCase().includes(query) ||
                    (user.email && user.email.toLowerCase().includes(query)) ||
                    (user.role && user.role.toLowerCase().includes(query))
                );
            });
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setSelectedQuiz(null);
        setQuizDetails(null);
    };

    const handleQuizClick = async (quizId) => {
        if (!selectedUser || !selectedUser.quizResults || !selectedUser.quizResults[quizId]) {
            return;
        }
        setSelectedQuiz(quizId);
        try {
            const quizResultRef = ref(database, `users/${selectedUser.id}/quizResults/${quizId}`);
            const snapshot = await get(quizResultRef);
            if (snapshot.exists()) {
                setQuizDetails(snapshot.val());
            } else {
                setQuizDetails(null);
            }
        } catch (error) {
            console.error("Error fetching quiz details:", error);
            setQuizDetails(null);
        }
    };

    // New function to delete an assigned set
    const handleDeleteAssignedSet = async (setId) => {
        if (!selectedUser) return;

        try {
            const setRef = ref(database, `users/${selectedUser.id}/assignedSets/${setId}`);
            await remove(setRef); // Remove the specific assigned set from Firebase

            // Update the local state to reflect the change immediately
            const updatedUser = {
                ...selectedUser,
                assignedSets: {
                    ...selectedUser.assignedSets,
                    [setId]: undefined // Mark as undefined to remove
                }
            };
            delete updatedUser.assignedSets[setId]; // Delete the key
            setSelectedUser(updatedUser);

            // Update the users array too
            setUsers(users.map(user => (user.id === selectedUser.id ? updatedUser : user)));
            setFilteredUsers(filteredUsers.map(user => (user.id === selectedUser.id ? updatedUser : user)));

            alert(`Assigned set ${setId} deleted successfully!`);
        } catch (error) {
            console.error("Error deleting assigned set:", error);
            alert("Failed to delete the assigned set.");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="users-container">
            <h1 className="page-title">User Management</h1>

            <div className="search-container">
                <span className="search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                    className={`user-item ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
                                    onClick={() => handleUserClick(user)}
                                    style={{ "--index": index }}
                                >
                                    <div className="user-email">{user.email || 'No email'}</div>
                                    <div className="user-meta">
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
                        {selectedQuiz && (
                            <button
                                className="back-button"
                                onClick={() => {
                                    setSelectedQuiz(null);
                                    setQuizDetails(null);
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

                                {selectedUser.quizResults && Object.keys(selectedUser.quizResults).length > 0 && (
                                    <div className="detail-section">
                                        <h3 className="subsection-title">Quiz Results</h3>
                                        <ul className="item-list interactive">
                                            {Object.keys(selectedUser.quizResults).map(quizId => (
                                                <li key={quizId} onClick={() => handleQuizClick(quizId)} className="clickable">
                                                    <div className="quiz-result-summary">
                                                        <span className="quiz-id">{quizId}</span>
                                                        <span className="view-details">View Details</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedUser.assignedSets && Object.keys(selectedUser.assignedSets).length > 0 && (
                                    <div className="detail-section">
                                        <h3 className="subsection-title">Assigned Sets</h3>
                                        <ul className="item-list">
                                            {Object.keys(selectedUser.assignedSets).map(setId => (
                                                <li key={setId} className="assigned-set-item">
                                                    <span>{setId}</span>
                                                    <button
                                                        className="delete-button"
                                                        onClick={() => handleDeleteAssignedSet(setId)}
                                                    >
                                                        Delete
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
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
                                        <div className="responses-container">
                                            {Object.keys(quizDetails.responses).map(questionId => {
                                                const response = quizDetails.responses[questionId];
                                                return (
                                                    <div key={questionId} className="response-item">
                                                        <div className="response-header">
                                                            <span>Question {questionId}</span>
                                                        </div>
                                                        <div className="response-content">
                                                            <div className="response-detail">
                                                                <span className="response-label">Selected Answer:</span>
                                                                <span className="response-value">
                                                                    {typeof response.selectedAnswer === 'object'
                                                                        ? response.selectedAnswer.text
                                                                        : response.selectedAnswer || 'Not answered'}
                                                                </span>
                                                            </div>
                                                            <div className="response-detail">
                                                                <span className="response-label">Correct Answer:</span>
                                                                <span className="response-value">
                                                                    {typeof response.correctAnswer === 'object'
                                                                        ? response.correctAnswer.text
                                                                        : response.correctAnswer || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="response-detail">
                                                                <span className="response-label">Is Correct:</span>
                                                                <span className={`response-value ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                                                                    {response.isCorrect ? 'Yes' : 'No'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
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