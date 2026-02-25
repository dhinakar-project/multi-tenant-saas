import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';

const AdminRoute = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const { isAdmin, isBootstrapping, isReady } = useTenant();

    if (!isLoaded || isBootstrapping) {
        return <div className="p-8 text-center text-gray-500">Loading admin context...</div>;
    }

    if (!isSignedIn) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        // Enforce TENANT_ADMIN explicitly
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
