// src/App.jsx

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Login from './components/login/login';
import Home from './components/home/Home';
import ProtectedRoute from './components/route/ProtectedRoute';
import Navbar from './components/navbar/Navbar';
import AllQuestions from './components/questions/AllQuestions';
import AttachedQuestion from './components/attachedQuestions/AttachedQuestion';
import AllQuestionsSet from './components/allQuestionsSet/AllQuestionsSet';
import Upload from './components/upload/upload';
import AllUsers from './components/allUsers/AllUsers';
import Syllabus from './components/syllabus/Syllabus';
import OfflineUsers from './components/offlineUsers/OfflineUsers';
import UploadMultiQuestion from './components/multiQ/UploadMultiQuestion';
import AdminStats from './components/AdminStats';

// ✅ New Components
import WorksheetGenManual from './components/worksheetManual/WorksheetGenManual';
import WorksheetGenSystem from './components/worksheetSystem/WorksheetGenSystem';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/home",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/worksheet-gen-manual",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <WorksheetGenManual />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/worksheet-gen-system",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <WorksheetGenSystem />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/all-questions",
    element: (
      <>
        <Navbar />
        <AllQuestions />
      </>
    ),
  },
  {
    path: "/attached-questions",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <AttachedQuestion />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/all-questions-set",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <AllQuestionsSet />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/upload",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <Upload />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/upload-multi",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <UploadMultiQuestion />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/allUsers",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <AllUsers />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/offlineUsers",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <OfflineUsers />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/admin-stats",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <AdminStats />
        </ProtectedRoute>
      </>
    ),
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
