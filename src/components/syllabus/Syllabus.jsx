import React, { useState, useEffect } from 'react';
import './Syllabus.css';
import { database } from '../firebase/FirebaseSetup'; // Update this path to match your project structure
import { ref, set, push, onValue, update, remove } from 'firebase/database';

const Syllabus = () => {
  // State for form inputs
  const [formData, setFormData] = useState({
    grade: 'G1',
    topic: '',
    topicCode: '',
    subtopic: '',
    subtopicCode: ''
  });

  // State for storing all syllabus entries
  const [syllabusEntries, setSyllabusEntries] = useState([]);
  
  // State for tracking which entry is being edited
  const [editIndex, setEditIndex] = useState(-1);
  const [editId, setEditId] = useState(null);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch data from Firebase on component mount
  useEffect(() => {
    const syllabusRef = ref(database, 'syllabus');
    
    onValue(syllabusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Firebase object to array with IDs
        const entriesArray = Object.entries(data).map(([id, values]) => ({
          id,
          ...values
        }));
        setSyllabusEntries(entriesArray);
      } else {
        setSyllabusEntries([]);
      }
      setLoading(false);
    });
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.topicCode) {
      alert('Please enter both a topic and a topic code');
      return;
    }

    // If subtopic is provided, ensure subtopic code is also provided
    if (formData.subtopic && !formData.subtopicCode) {
      alert('Please enter a code for the subtopic');
      return;
    }
    
    // Create entry data object
    const entryData = {
      grade: formData.grade,
      topic: formData.topic,
      topicCode: formData.topicCode,
      subtopic: formData.subtopic,
      subtopicCode: formData.subtopicCode
    };
    
    if (editId) {
      // Update existing entry in Firebase
      const entryRef = ref(database, `syllabus/${editId}`);
      update(entryRef, entryData)
        .then(() => {
          console.log('Entry updated successfully');
          setEditIndex(-1);
          setEditId(null);
        })
        .catch((error) => {
          console.error('Error updating entry:', error);
        });
    } else {
      // Add new entry to Firebase
      const syllabusRef = ref(database, 'syllabus');
      push(syllabusRef, entryData)
        .then(() => {
          console.log('Entry added successfully');
        })
        .catch((error) => {
          console.error('Error adding entry:', error);
        });
    }

    // Reset form
    setFormData({
      grade: formData.grade,
      topic: '',
      topicCode: '',
      subtopic: '',
      subtopicCode: ''
    });
  };

  // Handle edit entry
  const handleEdit = (index) => {
    const entry = syllabusEntries[index];
    setFormData({
      grade: entry.grade,
      topic: entry.topic,
      topicCode: entry.topicCode,
      subtopic: entry.subtopic || '',
      subtopicCode: entry.subtopicCode || ''
    });
    setEditIndex(index);
    setEditId(entry.id);
  };

  // Handle delete entry
  const handleDelete = (index) => {
    const entryId = syllabusEntries[index].id;
    const entryRef = ref(database, `syllabus/${entryId}`);
    
    remove(entryRef)
      .then(() => {
        console.log('Entry deleted successfully');
      })
      .catch((error) => {
        console.error('Error deleting entry:', error);
      });
  };

  // Function to query a specific syllabus item
  const querySpecificItem = (grade, topic, subtopic = null) => {
    const items = syllabusEntries.filter(entry => 
      entry.grade === grade && 
      entry.topic.toLowerCase() === topic.toLowerCase() &&
      (subtopic === null || entry.subtopic.toLowerCase() === subtopic.toLowerCase())
    );
    
    return items.length > 0 ? items : null;
  };

  return (
    <div className="syllabusContainer">
      <h1 className="page-title">Syllabus Management</h1>
      
      <div className="syllabus-layout">
        {/* Left side: Form */}
        <div className="syllabus-management">
          {/* Form */}
          <form onSubmit={handleSubmit} className="form-container">
            <h2 className="form-title">
              {editIndex >= 0 ? 'Edit Syllabus Entry' : 'Add Syllabus Entry'}
            </h2>
            
            {/* Grade Dropdown - Now on top */}
            <div className="form-group">
              <label className="label" htmlFor="grade">
                Grade:
              </label>
              <select
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="select"
              >
                <option value="G1">Grade 1</option>
                <option value="G2">Grade 2</option>
                <option value="G3">Grade 3</option>
                <option value="G4">Grade 4</option>
              </select>
            </div>
            
            <div className="form-row">
              {/* Topic Input and Code - Side by side */}
              <div className="form-group">
                <label className="label" htmlFor="topic">
                  Topic:
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g. Number System"
                  className="input"
                />
              </div>
              
              <div className="form-group">
                <label className="label" htmlFor="topicCode">
                  Topic Code:
                </label>
                <input
                  type="text"
                  id="topicCode"
                  name="topicCode"
                  value={formData.topicCode}
                  onChange={handleInputChange}
                  placeholder="e.g. G1N"
                  className="input"
                />
              </div>
            </div>
            
            <div className="form-row">
              {/* Subtopic Input and Code - Side by side */}
              <div className="form-group">
                <label className="label" htmlFor="subtopic">
                  Subtopic:
                </label>
                <input
                  type="text"
                  id="subtopic"
                  name="subtopic"
                  value={formData.subtopic}
                  onChange={handleInputChange}
                  placeholder="e.g. Addition"
                  className="input"
                />
              </div>
              
              <div className="form-group">
                <label className="label" htmlFor="subtopicCode">
                  Subtopic Code:
                </label>
                <input
                  type="text"
                  id="subtopicCode"
                  name="subtopicCode"
                  value={formData.subtopicCode}
                  onChange={handleInputChange}
                  placeholder="e.g. G1N1"
                  className="input"
                  disabled={!formData.subtopic}
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
              >
                {editIndex >= 0 ? 'Update Entry' : 'Add Entry'}
              </button>
              
              {/* Cancel Edit Button */}
              {editIndex >= 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditIndex(-1);
                    setEditId(null);
                    setFormData({
                      grade: 'G1',
                      topic: '',
                      topicCode: '',
                      subtopic: '',
                      subtopicCode: ''
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Right side: Search and Display Entries */}
        <div className="entries-section">
          {/* Search Function - Now at the top of entries section */}
          <div className="search-section">
            <h2 className="search-title">Search Syllabus</h2>
            <div className="search-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="label" htmlFor="searchGrade">Grade:</label>
                  <select id="searchGrade" className="select">
                    <option value="G1">Grade 1</option>
                    <option value="G2">Grade 2</option>
                    <option value="G3">Grade 3</option>
                    <option value="G4">Grade 4</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="searchTopic">Topic:</label>
                  <input type="text" id="searchTopic" className="input" placeholder="e.g. Number System" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label" htmlFor="searchSubtopic">Subtopic (Optional):</label>
                  <input type="text" id="searchSubtopic" className="input" placeholder="e.g. Place Value & Number Names" />
                </div>
                <div className="form-group search-button-container">
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      const grade = document.getElementById('searchGrade').value;
                      const topic = document.getElementById('searchTopic').value;
                      const subtopic = document.getElementById('searchSubtopic').value;
                      
                      if (!topic) {
                        alert('Please enter at least a topic to search');
                        return;
                      }
                      
                      const results = querySpecificItem(grade, topic, subtopic || null);
                      if (results) {
                        alert(`Found ${results.length} matching entries. Check console for details.`);
                        console.log('Search results:', results);
                      } else {
                        alert('No matching entries found.');
                      }
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Display Entries */}
          <div className="table-section">
            <h2 className="table-title">Syllabus Entries</h2>
            
            {loading ? (
              <div className="loading-message">Loading entries...</div>
            ) : syllabusEntries.length === 0 ? (
              <div className="empty-message">
                No entries yet. Use the form to add syllabus content.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead className="table-head">
                    <tr>
                      <th className="table-header">Grade</th>
                      <th className="table-header">Topic</th>
                      <th className="table-header">Code</th>
                      <th className="table-header">Subtopic</th>
                      <th className="table-header">Code</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syllabusEntries.map((entry, index) => (
                      <tr key={entry.id} className="table-row fade-in">
                        <td className="table-cell">
                          {entry.grade === 'G1' ? 'G1' : 
                           entry.grade === 'G2' ? 'G2' : 
                           entry.grade === 'G3' ? 'G3' : 'G4'}
                        </td>
                        <td className="table-cell">{entry.topic}</td>
                        <td className="table-cell">
                          <span className="badge badge-blue">{entry.topicCode}</span>
                        </td>
                        <td className="table-cell">{entry.subtopic || '-'}</td>
                        <td className="table-cell">
                          {entry.subtopicCode ? (
                            <span className="badge badge-blue">{entry.subtopicCode}</span>
                          ) : '-'}
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => handleEdit(index)}
                            className="btn-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Syllabus;