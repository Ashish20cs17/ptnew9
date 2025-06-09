import React from 'react';
import Login from './components/login/login';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/home/Home';
import ProtectedRoute from './components/route/ProtectedRoute';
import Navbar from './components/navbar/Navbar';
import "./App.css";
import AllQuestions from './components/questions/AllQuestions';
import AttachedQuestion from './components/attachedQuestions/AttachedQuestion';
import AllQuestionsSet from './components/allQuestionsSet/AllQuestionsSet';
import Upload from './components/upload/upload';
import AllUsers from './components/allUsers/AllUsers';
import Syllabus from './components/syllabus/Syllabus';
import OfflineUsers from './components/offlineUsers/OfflineUsers';
import UploadMultiQuestion from './components/multiQ/UploadMultiQuestion'; // ✅ Use correct relative path
import AdminStats from './components/AdminStats';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
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
    )
  },
  {
    path: "/all-questions",
    element: (
      <>
        <Navbar />
        <AllQuestions />
      </>
    )
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
    )
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
    )
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
    )
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
    )
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
    )
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
    )
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
    )
  }
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
