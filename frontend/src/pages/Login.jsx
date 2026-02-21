import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [formData, setFormData] = useState({ slug: 'demo-org', email: 'admin@demo.org', password: 'Admin@123' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');

    useEffect(() => {
        if (location.state?.slug) {
            const sanitizedSlug = location.state.slug.trim().toLowerCase().replace(/_/g, '-');
            setFormData(prev => ({ ...prev, slug: sanitizedSlug }));
            localStorage.setItem('tenantSlug', sanitizedSlug);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(formData.slug, formData.email, formData.password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || 'Invalid credentials or tenant');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold text-center">Login</h2>
                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium">Tenant Slug</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-1 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                        Login
                    </button>
                    <div className="mt-4 text-center">
                        <Link to="/signup" className="text-sm text-blue-500 hover:underline">
                            Register new Organization
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
