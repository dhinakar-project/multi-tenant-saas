import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';

function TicketCreate() {
    const { getToken } = useAuth();
    const [formData, setFormData] = useState({ title: '', description: '', priority: 'Medium' });
    const [showAiBadge, setShowAiBadge] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setClerkTokenGetter(getToken);
    }, [getToken]);

    const tenantSlug = localStorage.getItem('tenantSlug');

    if (!tenantSlug) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="glass-card-light p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">No Tenant Selected</h2>
                    <p className="text-gray-600 mb-6">Please sign in to your organization to create a ticket.</p>
                    <button onClick={() => navigate('/login')} className="btn-primary w-full">Go to Login</button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tickets', formData);
            setShowAiBadge(true);
            setTimeout(() => {
                setShowAiBadge(false);
                navigate('/dashboard');
            }, 4000);
        } catch (e) {
            alert('Failed to create ticket');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="glass-card-light p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Ticket</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            required
                            placeholder="Enter ticket title..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                            placeholder="Describe the issue in detail..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Urgent</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Create Ticket
                        </button>
                    </div>
                </form>

                {/* AI Analyzing Badge */}
                {showAiBadge && (
                    <div className="mt-6 flex items-center justify-center">
                        <span className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium rounded-full animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>✦ AI is analyzing...</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TicketCreate;
