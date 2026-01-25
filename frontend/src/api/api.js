import axios from 'axios';

/**
 * Determines the API base URL dynamically based on how the frontend is accessed.
 * Priority:
 * 1. VITE_API_URL environment variable (if set)
 * 2. localhost/127.0.0.1 → http://localhost:8080/api
 * 3. LAN IP → http://{hostname}:8080/api
 */
function getApiBaseUrl() {
    // Highest priority: use environment variable if set (e.g., Docker build)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Dynamic detection based on current hostname
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Localhost access → use localhost for backend
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8080/api';
        }

        // LAN IP access → use same hostname for backend
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        return `${protocol}//${hostname}:8080/api`;
    }

    // Fallback for SSR or non-browser environments
    return 'http://localhost:8080/api';
}

const api = axios.create({
    baseURL: getApiBaseUrl(),
});

// Store Clerk token getter function (injected by components)
let clerkTokenGetter = null;

export const setClerkTokenGetter = (getter) => {
    clerkTokenGetter = getter;
};

api.interceptors.request.use(async (config) => {
    // Try to get Clerk token first
    let token = null;
    if (clerkTokenGetter) {
        try {
            token = await clerkTokenGetter();
        } catch (e) {
            console.error('Failed to get Clerk token:', e);
        }
    }

    // Fallback to old localStorage token (for backward compatibility during migration)
    if (!token) {
        token = localStorage.getItem('token');
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach X-Tenant-Slug header for all requests except tenant registration
    const tenantSlug = localStorage.getItem('tenantSlug');
    if (tenantSlug && !config.url.startsWith('/tenants')) {
        config.headers['X-Tenant-Slug'] = tenantSlug;
    }

    return config;
});

export default api;

