import { useState } from 'react'
import React from 'react'
import Login from './components/login/login'
import { BrowserRouter as Router, Routes, Route, createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/home/Home'
import ProtectedRoute from './components/route/ProtectedRoute';

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login/>},
      {
        path: "/home",
        element:<ProtectedRoute> <Home/></ProtectedRoute>},
    
  ])
  return (
    
    <>
    <RouterProvider router = {router}/>
    </>
  )
}

export default App