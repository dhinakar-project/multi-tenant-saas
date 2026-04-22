import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';
import { useTenant } from '../context/TenantContext';
import VoiceAssistant from '../components/VoiceAssistant';
import { SkeletonList } from '../components/SkeletonCard';

function AiInsightsCard({ ticket }) {
    const { aiStatus, aiCategory, aiSuggestedPriority, aiConfidence, aiReasoning } = ticket;

    if (!aiStatus || aiStatus === 'PENDING') {
        return (
            <div className="glass-card p-6 flex flex-col items-center justify-center gap-4 border-dashed border-2 border-violet-500/20 bg-violet-500/5 my-8">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 border-[3px] border-violet-400 border-t-violet-100 rounded-full animate-spin flex-shrink-0" />
                    <h3 className="text-white font-semibold text-lg">AI Analysis in Progress</h3>
                </div>
                <p className="text-slate-400 text-sm">Gemini Flash is analyzing this ticket...</p>
            </div>
        );
    }

    if (aiStatus === 'FAILED') {
        return (
            <div className="glass-card p-6 border-dashed border-2 border-slate-700/50 bg-slate-800/20 my-8">
                <span className="text-slate-500 font-medium">✦ AI Analysis Unavailable</span>
                <p className="text-slate-600 text-sm mt-2">The Gemini AI model could not process this ticket.</p>
            </div>
        );
    }

    if (aiStatus === 'DONE') {
        const confidencePct = aiConfidence != null ? Math.round(aiConfidence * 100) : null;
        
        const priorityColors = {
            Critical: 'badge-critical',
            Urgent: 'badge-urgent',
            High: 'badge-high',
            Medium: 'badge-medium',
            Low: 'badge-low'
        };

        return (
            <div className="bg-gradient-to-br from-violet-50 to-white border-2 border-violet-200 rounded-2xl p-6 my-8 shadow-sm">
                
                {/* Header row */}
                <div className="flex items-start justify-between mb-6">
                    <h3 className="text-violet-700 font-bold text-lg flex items-center gap-2">
                        <span className="text-violet-400">✦</span> AI Analysis
                    </h3>
                    <span className="badge badge-ai">Powered by Gemini Flash</span>
                </div>

                {/* 3-column info grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Col 1 */}
                    <div className="bg-white rounded-xl p-4 border border-violet-100/50 shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-violet-400 text-[10px] uppercase font-bold tracking-widest mb-2">Category</span>
                        {aiCategory ? (
                            <span className="bg-violet-100 text-violet-700 font-bold px-4 py-1.5 rounded-full text-sm">
                                {aiCategory}
                            </span>
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                    </div>

                    {/* Col 2 */}
                    <div className="bg-white rounded-xl p-4 border border-violet-100/50 shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-violet-400 text-[10px] uppercase font-bold tracking-widest mb-2">Suggested Priority</span>
                        {aiSuggestedPriority ? (
                            <span className={`badge ${priorityColors[aiSuggestedPriority] || 'badge-low'} px-4 py-1.5 text-sm`}>
                                {aiSuggestedPriority}
                            </span>
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                    </div>

                    {/* Col 3 */}
                    <div className="bg-white rounded-xl p-4 border border-violet-100/50 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <span className="text-violet-400 text-[10px] uppercase font-bold tracking-widest mb-1 relative z-10">Confidence</span>
                        {confidencePct !== null ? (
                            <div className="relative z-10 w-full">
                                <span className="text-3xl font-extrabold text-violet-600 tabular-nums">
                                    {confidencePct}%
                                </span>
                                <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-violet-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${confidencePct}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-400 relative z-10">—</span>
                        )}
                    </div>
                </div>

                {/* Reasoning box */}
                {aiReasoning && (
                    <div className="bg-violet-50/50 rounded-xl p-5 border border-violet-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-amber-500 text-sm">💡</span>
                            <span className="text-violet-600 font-bold text-xs uppercase tracking-wider">AI Reasoning</span>
                        </div>
                        <p className="text-gray-700 text-sm italic leading-relaxed pl-6 border-l-2 border-violet-200/50">
                            {aiReasoning}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return null;
}

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
            <div className="max-w-4xl mx-auto p-8 mt-10">
                <SkeletonList count={3} lines={5} />
            </div>
        );
    }

    const priorityColors = {
        Critical: 'badge-critical',
        Urgent: 'badge-urgent',
        High: 'badge-high',
        Medium: 'badge-medium',
        Low: 'badge-low'
    };

    const statusColors = {
        Open: 'badge-open',
        InProgress: 'badge-inprogress',
        Resolved: 'badge-resolved',
        Closed: 'badge-closed'
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
            
            {/* Back Navigation */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium bg-transparent border-none cursor-pointer py-2 group"
            >
                <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Dashboard
            </button>

            {/* Main Ticket Card (Light surface) */}
            <div className="glass-card-light p-8 px-10">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-2 gap-6">
                    <h1 className="text-gray-900 text-3xl font-bold tracking-tight leading-tight">
                        {ticket.title}
                    </h1>
                    <div className="flex-shrink-0 mt-1.5">
                        <span className={`badge ${priorityColors[ticket.priority] || 'badge-low'} px-3 py-1.5 text-sm`}>
                            {ticket.priority}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-8 mb-8 text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {ticket.description}
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gray-50/80 border border-gray-100 rounded-xl mb-8">
                    <div>
                        <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Status</span>
                        <span className={`badge ${statusColors[ticket.status] || 'badge-low'} px-2.5 py-1 text-xs`}>
                             {ticket.status}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Created</span>
                        <span className="text-gray-700 font-medium text-sm">
                            {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Ticket ID</span>
                        <span className="text-gray-500 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {ticket.id.substring(0, 8)}...
                        </span>
                    </div>
                </div>

                {/* Status Control — RBAC-Aware */}
                <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <span>Change Status</span>
                        {!isAdmin && (
                            <svg className="w-4 h-4 text-gray-400 inline" fill="currentColor" viewBox="0 0 20 20" aria-label="Restricted">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span>:</span>
                    </label>

                    <div className={`relative ${!isAdmin ? 'group inline-block' : 'inline-block'}`}>
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={!isAdmin}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium outline-none transition-all ${
                                isAdmin 
                                ? 'bg-white border-2 border-gray-200 text-gray-800 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 cursor-pointer shadow-sm'
                                : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-70 appearance-none'
                            }`}
                        >
                            <option value="Open">Open</option>
                            <option value="InProgress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>

                        {!isAdmin && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-10 hidden group-hover:block w-64">
                                <div className="bg-gray-800 text-white text-xs font-medium rounded-lg px-3 py-2 text-center shadow-xl">
                                    Only administrators can modify ticket status.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* AI Insights Card */}
            <AiInsightsCard ticket={ticket} />

            {/* Comments Section */}
            <div className="glass-card-light p-8 px-10">
                <h2 className="text-gray-900 text-xl font-bold mb-6 flex items-center gap-3">
                    Comments 
                    <span className="bg-gray-100 text-gray-500 text-sm py-0.5 px-2.5 rounded-full font-semibold">
                        {comments.length}
                    </span>
                </h2>

                <div className="space-y-4 mb-8">
                    {comments.map((c) => (
                        <div key={c.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100 border-l-4 border-l-violet-300 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <span className="font-bold text-gray-900 tracking-tight">
                                    {c.author ? c.author.fullName : 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
                                    {new Date(c.createdAt).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <p className="text-gray-700 text-[15px] leading-relaxed m-0">{c.message}</p>
                        </div>
                    ))}
                    
                    {comments.length === 0 && (
                        <div className="text-center py-10 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                            <div className="text-gray-300 text-4xl mb-3">💬</div>
                            <p className="text-gray-500 italic font-medium">No comments yet.</p>
                            <p className="text-gray-400 text-sm mt-1">Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleAddComment} className="flex flex-col gap-4 mt-2 border-t border-gray-100 pt-8">
                    <textarea
                        className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 text-[15px] focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none resize-none min-h-[120px]"
                        placeholder="Add a comment... (Markdown not supported yet)"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary" disabled={!newComment.trim()}>
                            Post Comment
                        </button>
                    </div>
                </form>
            </div>

            {/* Voice AI Assistant — floats bottom-right, explains this ticket */}
            {ticket && (
                <VoiceAssistant
                    mode="ticket"
                    ticketId={id}
                    ticketTitle={ticket.title || ''}
                />
            )}

        </div>
    );
}

export default TicketDetail;
