import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';

function TicketCreate() {
    const { getToken } = useAuth();
    const [formData, setFormData] = useState({ title: '', description: '', priority: 'Medium' });
    const navigate = useNavigate();

    useEffect(() => {
        setClerkTokenGetter(getToken);
    }, [getToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tickets', formData);
            navigate('/dashboard');
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
            </div>
        </div>
    );
}

export default TicketCreate;
