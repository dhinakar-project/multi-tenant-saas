import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import { SkeletonList } from './SkeletonCard';

const AdminRoute = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const { isAdmin, isBootstrapping, isReady } = useTenant();

    if (!isLoaded || isBootstrapping) {
        return (
            <div className="max-w-6xl mx-auto p-8 mt-10">
                <SkeletonList count={4} lines={4} />
            </div>
        );
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
