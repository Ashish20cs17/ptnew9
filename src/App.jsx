import { useState } from 'react'
import React from 'react'
import Login from './components/login/login'
import { BrowserRouter as Router, Routes, Route, createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/home/Home'
import ProtectedRoute from './components/route/ProtectedRoute';
import Navbar from './components/navbar/Navbar';
import "./App.css"
import AllQuestions from './components/questions/AllQuestions';
import AttachedQuestion from './components/attachedQuestions/AttachedQuestion';

import AllQuestionsSet from './components/allQuestionsSet/AllQuestionsSet';
import Upload from '../src/components/upload/upload';

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login />
    },
    {
      path: "/home",
      element: <><Navbar /><ProtectedRoute> <Home /></ProtectedRoute></>
    }, {

      path: "/all-questions", // ✅ Add new route
      element: (
        <>
          <Navbar />
          <AllQuestions />
        </>
      ),
    },
    {
      path: "/attached-questions", // ✅ Add new route
      element: <><Navbar /><ProtectedRoute> <AttachedQuestion /></ProtectedRoute></>
    },
    {
      path: "/all-questions-set", // ✅ Add new route
      element: <><Navbar /><ProtectedRoute> <AllQuestionsSet /></ProtectedRoute></>
    },
    {
      path: "/upload", // ✅ Add new route
      element: <><Navbar /><ProtectedRoute> <Upload /></ProtectedRoute></>
    }

  ])
  return (

    <>

      <RouterProvider router={router} />
    </>
  )
}

export default App