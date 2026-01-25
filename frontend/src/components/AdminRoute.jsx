import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { user, token } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!user || !user.roles || !user.roles.includes('ADMIN')) {
        // In real app, might show a nice "Unauthorized" page
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
