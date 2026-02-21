import axios from 'axios';

/**
 * API base URL configuration:
 * - Dev mode (npm run dev): Uses /api → Vite proxy forwards to localhost:8080/api
 * - Docker mode: Uses /api → nginx reverse proxy forwards to mt_backend:8080/api
 * - Environment variable VITE_API_URL can override (set to /api in Dockerfile)
 */
function getApiBaseUrl() {
    // Use environment variable if set (Docker build sets this to /api)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Default to /api for both dev and production
    // Dev: Vite proxy handles forwarding
    // Docker: nginx reverse proxy handles forwarding
    return '/api';
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
    // Get Clerk token (ONLY auth source)
    let token = null;
    if (clerkTokenGetter) {
        try {
            token = await clerkTokenGetter();
        } catch (e) {
            console.error('Failed to get Clerk token:', e);
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach X-Tenant-Slug header for all requests except tenant registration
    let tenantSlug = localStorage.getItem('tenantSlug');
    if (tenantSlug && !config.url.startsWith('/tenants')) {
        // Sanitize slug: lowercase, trim, replace underscores with hyphens
        tenantSlug = tenantSlug.trim().toLowerCase().replace(/_/g, '-');
        config.headers['X-Tenant-Slug'] = tenantSlug;
        console.log(`[API] Attaching X-Tenant-Slug: ${tenantSlug}`);
    }

    return config;
});

export default api;

