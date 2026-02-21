import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

function Signup() {
    const [formData, setFormData] = useState({
        tenantName: '',
        tenantSlug: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const sanitizedSlug = formData.tenantSlug.trim().toLowerCase().replace(/_/g, '-');
            const payload = { ...formData, tenantSlug: sanitizedSlug };

            await api.post('/tenants', payload);
            navigate('/login', { state: { slug: sanitizedSlug } });
        } catch (err) {
            console.error(err);
            // Display the actual backend error message
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold text-center">Register Tenant</h2>
                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium">Organization Name</label>
                        <input
                            type="text"
                            name="tenantName"
                            className="w-full p-2 border rounded"
                            required
                            value={formData.tenantName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium">Tenant Slug (Unique)</label>
                        <input
                            type="text"
                            name="tenantSlug"
                            className="w-full p-2 border rounded"
                            required
                            placeholder="e.g. acme-corp"
                            value={formData.tenantSlug}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium">Admin Name</label>
                        <input
                            type="text"
                            name="adminName"
                            className="w-full p-2 border rounded"
                            required
                            value={formData.adminName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium">Admin Email</label>
                        <input
                            type="email"
                            name="adminEmail"
                            className="w-full p-2 border rounded"
                            required
                            value={formData.adminEmail}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-1 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            name="adminPassword"
                            className="w-full p-2 border rounded"
                            required
                            value={formData.adminPassword}
                            onChange={handleChange}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-400"
                    >
                        {loading ? 'Registering...' : 'Sign Up'}
                    </button>
                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm text-blue-500 hover:underline">
                            Already have an account? Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Signup;
