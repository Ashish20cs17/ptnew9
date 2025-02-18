import { useState } from 'react'
import React from 'react'
import Login from './components/login/login'
import { BrowserRouter as Router, Routes, Route, createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/home/Home'
import ProtectedRoute from './components/route/ProtectedRoute';
import Navbar from './components/navbar/Navbar';
import "./App.css"
import AllQuestions from './components/questions/AllQuestions';

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login/>},
      {
        path: "/home",
        element:<><Navbar /><ProtectedRoute> <Home/></ProtectedRoute></>},{

        path: "/all-questions", // ✅ Add new route
      element: (
        <>
          <Navbar />
          <AllQuestions />
        </>
      ),
    },
   
  ])
  return (
    
    <>
    
    <RouterProvider router = {router}/>
    </>
  )
}

export default App