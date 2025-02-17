import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const isLoggedIn = localStorage.getItem("user");

    return isLoggedIn ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
