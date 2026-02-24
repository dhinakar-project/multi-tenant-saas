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
                const response = await api.post('/tenants/bootstrap');
                const { tenantSlug: slug, tenantName: name, isNewTenant } = response.data;

                console.log(`[TenantContext] Bootstrap complete: ${slug} (new: ${isNewTenant})`);

                setTenantSlug(slug);
                setTenantName(name);

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
            bootstrapInitiatedRef.current = false;
            localStorage.removeItem('tenantSlug');
        }
    }, [isLoaded, isSignedIn]);

    const value = {
        tenantSlug,
        tenantName,
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
