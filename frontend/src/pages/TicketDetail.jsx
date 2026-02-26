import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';
import { useTenant } from '../context/TenantContext';

function TicketDetail() {
    const { id } = useParams();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const { isAdmin } = useTenant();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        setClerkTokenGetter(getToken);
    }, [getToken]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        const [ticketRes, commentsRes] = await Promise.all([
            api.get(`/tickets/${id}`),
            api.get(`/tickets/${id}/comments`)
        ]);
        setTicket(ticketRes.data);
        setComments(commentsRes.data);
    };

    const handleStatusChange = async (newStatus) => {
        await api.patch(`/tickets/${id}/status`, { status: newStatus });
        fetchData();
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        await api.post(`/tickets/${id}/comments`, { message: newComment });
        setNewComment('');
        fetchData();
    };

    if (!ticket) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
            </button>

            {/* Ticket Details Card */}
            <div className="glass-card-light p-8">
                <div className="flex items-start justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
                    <span className={`px-4 py-2 text-sm font-bold rounded-lg ${ticket.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                        }`}>
                        {ticket.priority}
                    </span>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap mb-6 leading-relaxed">{ticket.description}</p>

                <div className="flex items-center space-x-6 text-sm text-gray-600 border-t border-gray-200 pt-6 mb-6">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                            ticket.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                                ticket.status === 'Resolved' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {ticket.status}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-900">Created:</span> {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {/* Status Control — RBAC-Aware */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        {/* Label with lock icon for non-admins */}
                        <label className="flex items-center space-x-1.5 text-sm font-semibold text-gray-700">
                            <span>Change Status</span>
                            {!isAdmin && (
                                <svg
                                    className="w-3.5 h-3.5 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-label="Restricted"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                            <span>:</span>
                        </label>

                        {/* Tooltip wrapper — only for non-admins */}
                        <div
                            className={!isAdmin ? 'relative group' : ''}
                        >
                            <select
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={!isAdmin}
                                className={`px-4 py-2 border rounded-lg text-sm transition-all ${isAdmin
                                        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer bg-white text-gray-900'
                                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 select-none'
                                    }`}
                            >
                                <option>Open</option>
                                <option>InProgress</option>
                                <option>Resolved</option>
                                <option>Closed</option>
                            </select>

                            {/* Tooltip — visible on hover only for non-admins */}
                            {!isAdmin && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 hidden group-hover:flex">
                                    <div className="bg-gray-800 text-white text-xs font-medium rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                                        Only administrators can modify ticket status.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Helper message for non-admins */}
                    {!isAdmin && (
                        <p className="flex items-center space-x-1.5 text-xs text-gray-400 pl-1">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Only administrators can modify ticket status.</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Comments Card */}
            <div className="glass-card-light p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>

                <div className="space-y-4 mb-8">
                    {comments.map((c) => (
                        <div key={c.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-gray-900">
                                    {c.author ? c.author.fullName : 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(c.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-gray-700">{c.message}</p>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-gray-500 italic text-center py-8">
                            No comments yet. Be the first to comment!
                        </p>
                    )}
                </div>

                <form onSubmit={handleAddComment} className="space-y-4">
                    <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        rows="4"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn-primary">
                        Post Comment
                    </button>
                </form>
            </div>
        </div>
    );
}

export default TicketDetail;
