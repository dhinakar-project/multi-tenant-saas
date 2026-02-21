import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [tenantSlug, setTenantSlug] = useState(() => {
        const stored = localStorage.getItem('tenantSlug');
        if (stored) {
            const sanitized = stored.trim().toLowerCase().replace(/_/g, '-');
            if (sanitized !== stored) {
                localStorage.setItem('tenantSlug', sanitized);
                return sanitized;
            }
            return stored;
        }
        return null;
    });

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({ roles: [] });
            } catch (e) {
                logout();
            }
        }
    }, [token]);

    const login = async (slug, email, password) => {
        // Sanitize slug
        const sanitizedSlug = slug.trim().toLowerCase().replace(/_/g, '-');

        // CRITICAL: Set tenant slug in localStorage BEFORE making the API call
        // so the axios interceptor can attach it to the request headers
        localStorage.setItem('tenantSlug', sanitizedSlug);
        setTenantSlug(sanitizedSlug);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, userFullName, roles } = response.data;

            setToken(token);
            localStorage.setItem('token', token);
            setUser({ fullName: userFullName, roles });
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setTenantSlug(null);
        localStorage.removeItem('token');
        localStorage.removeItem('tenantSlug');
    };

    return (
        <AuthContext.Provider value={{ user, token, tenantSlug, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
