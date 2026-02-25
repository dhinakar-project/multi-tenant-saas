import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';

const TenantContext = createContext(null);

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within TenantProvider');
    }
    return context;
};

export const TenantProvider = ({ children }) => {
    const { isSignedIn, isLoaded, getToken } = useAuth();
    const [tenantSlug, setTenantSlug] = useState(null);
    const [tenantName, setTenantName] = useState(null);
    const [userRole, setUserRole] = useState(null); // RBAC: populated from bootstrap response
    const [isBootstrapping, setIsBootstrapping] = useState(false);
    const [bootstrapError, setBootstrapError] = useState(null);
    const bootstrapInitiatedRef = useRef(false);

    // Set Clerk token getter for API interceptor
    useEffect(() => {
        if (getToken) {
            setClerkTokenGetter(getToken);
        }
    }, [getToken]);

    useEffect(() => {
        const bootstrapTenant = async () => {
            // Only bootstrap if user is signed in and we don't have a tenant yet
            if (!isLoaded || !isSignedIn || tenantSlug || bootstrapInitiatedRef.current) {
                return;
            }

            bootstrapInitiatedRef.current = true;
            setIsBootstrapping(true);
            setBootstrapError(null);

            try {
                console.log('[TenantContext] Bootstrapping tenant...');

                // Check if a pending invite token exists from Join.jsx workflow
                const pendingToken = sessionStorage.getItem('pending_invite_token');

                const response = await api.post('/tenants/bootstrap', null, {
                    params: pendingToken ? { token: pendingToken } : {}
                });

                // Clear the token now that it has been safely consumed by the backend
                if (pendingToken) {
                    sessionStorage.removeItem('pending_invite_token');
                    console.log('[TenantContext] Pending invite token consumed successfully.');
                }

                const { tenantSlug: slug, tenantName: name, isNewTenant, role } = response.data;

                console.log(`[TenantContext] Bootstrap complete: ${slug} (new: ${isNewTenant}, role: ${role})`);

                setTenantSlug(slug);
                setTenantName(name);
                setUserRole(role || null); // Store role for UI-level RBAC guards

                // Store in localStorage for axios interceptor
                localStorage.setItem('tenantSlug', slug);
            } catch (error) {
                console.error('[TenantContext] Bootstrap failed:', error);
                console.error('[TenantContext] Error response:', error.response);
                console.error('[TenantContext] Error status:', error.response?.status);
                console.error('[TenantContext] Error data:', error.response?.data);
                setBootstrapError(error.response?.data?.message || error.message || 'Failed to bootstrap tenant');
            } finally {
                setIsBootstrapping(false);
            }
        };

        bootstrapTenant();
    }, [isLoaded, isSignedIn, tenantSlug]);

    // Clear tenant on sign out
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            setTenantSlug(null);
            setTenantName(null);
            setUserRole(null);
            bootstrapInitiatedRef.current = false;
            localStorage.removeItem('tenantSlug');
        }
    }, [isLoaded, isSignedIn]);

    const value = {
        tenantSlug,
        tenantName,
        userRole,
        isAdmin: userRole === 'TENANT_ADMIN', // Convenience flag for conditional rendering
        isBootstrapping,
        bootstrapError,
        isReady: isLoaded && (!isSignedIn || (isSignedIn && tenantSlug !== null))
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};
