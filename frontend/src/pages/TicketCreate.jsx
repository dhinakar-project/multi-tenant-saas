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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass-card p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-white mb-3 tracking-tight">No Tenant Selected</h2>
                    <p className="text-slate-400 mb-6 text-sm">Please sign in to your organization to create a ticket.</p>
                    <button onClick={() => navigate('/login')} className="btn-primary w-full shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_28px_rgba(124,58,237,0.5)]">Go to Login</button>
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

    const inputClasses = "w-full bg-[#0a0a0c] border border-white/10 text-white text-[15px] font-medium rounded-xl px-5 py-3.5 focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none placeholder:text-slate-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]";

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-up pb-16">
            
            {/* Header Section */}
            <div className="text-center mb-10 pt-4 relative">
                {/* Background glow behind header */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none -z-10"></div>
                
                <span className="badge badge-ai mb-4 px-3 py-1 font-semibold tracking-wide border border-violet-500/30 bg-violet-500/10">✦ AI-Assisted Form</span>
                <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400 drop-shadow-sm">
                    Create New Ticket
                </h1>
                <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
                    Describe your issue in detail. Our enterprise AI classification engine will automatically triage it.
                </p>
            </div>

            {/* Main Form Card */}
            <div className="glass-card p-1 relative overflow-hidden">
                {/* Inner glowing top border */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>

                <div className="bg-[#0c0c0e]/80 rounded-[15px] p-8 md:p-10 backdrop-blur-xl">
                    
                    {/* Info Banner */}
                    <div className="mb-8 p-5 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-transparent flex gap-4 items-start relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[40px] rounded-full group-hover:bg-violet-500/20 transition-all duration-700"></div>
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-violet-500/30">✨</div>
                        <div>
                            <h3 className="text-violet-300 font-bold mb-1 tracking-wide">Automated Categorization</h3>
                            <p className="text-slate-400 text-[14px] leading-relaxed pr-6">
                                After submission, Gemini 2.5 Flash analyzes your context to suggest the optimal <span className="text-slate-300 font-medium">category</span>, <span className="text-slate-300 font-medium">priority</span>, and resolution routing.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                        
                        {/* Title */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-300 text-[13px] font-bold uppercase tracking-wider mb-2.5 ml-1">
                                Ticket Subject <span className="text-violet-500 text-lg leading-none">*</span>
                            </label>
                            <input
                                type="text"
                                className={inputClasses}
                                required
                                placeholder="e.g., Cannot access billing portal on staging environment"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-300 text-[13px] font-bold uppercase tracking-wider mb-2.5 ml-1">
                                Detailed Description <span className="text-violet-500 text-lg leading-none">*</span>
                            </label>
                            <div className="relative">
                                <textarea
                                    className={`${inputClasses} h-48 resize-none`}
                                    required
                                    placeholder="Please describe the issue in maximum detail...&#10;&#10;• Steps to reproduce&#10;• Expected behavior&#10;• Actual behavior&#10;• Error messages or logs"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                <div className="absolute bottom-3 right-4 text-xs font-medium text-slate-500 pointer-events-none">
                                    Markdown supported (Soon)
                                </div>
                            </div>
                        </div>

                        {/* Priority Selection Grid */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-300 text-[13px] font-bold uppercase tracking-wider mb-3 ml-1">
                                Base Priority Level
                            </label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { level: 'Low', desc: 'Non-urgent improvement', icon: '🔵', bg: 'hover:bg-slate-800/50', border: 'border-slate-700' },
                                    { level: 'Medium', desc: 'Broken but workaround exists', icon: '🟡', bg: 'hover:bg-yellow-500/10', border: 'border-yellow-500/30' },
                                    { level: 'High', desc: 'Significant impact', icon: '🟠', bg: 'hover:bg-orange-500/10', border: 'border-orange-500/40' },
                                    { level: 'Urgent', desc: 'Production down context', icon: '🔴', bg: 'hover:bg-red-500/10', border: 'border-red-500/50' }
                                ].map((p) => (
                                    <label key={p.level} className={`cursor-pointer transition-all duration-200 border rounded-xl p-4 flex items-start gap-3 relative overflow-hidden group 
                                        ${formData.priority === p.level 
                                            ? `bg-white/[0.04] ${p.border} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]` 
                                            : `bg-[#0a0a0c] border-white/5 ${p.bg}`}`}>
                                        
                                        <input 
                                            type="radio" 
                                            name="priority" 
                                            value={p.level}
                                            checked={formData.priority === p.level}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="mt-1 w-4 h-4 bg-transparent border-slate-500 text-violet-500 focus:ring-violet-500/30 cursor-pointer accent-violet-500"
                                        />
                                        <div>
                                            <div className="font-bold text-white mb-1 tracking-wide text-sm">{p.level}</div>
                                            <div className="text-slate-400 text-xs leading-relaxed pr-2">{p.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pt-8 mt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn-secondary px-6"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary space-x-2 px-8 py-[13px] text-[15px] shadow-[0_4px_24px_rgba(124,58,237,0.4)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.6)]">
                                <span>Submit Ticket</span>
                                <span className="opacity-70 group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </button>
                        </div>
                    </form>

                    {/* AI Processing Overlay */}
                    {showAiBadge && (
                        <div className="absolute inset-0 z-50 rounded-[15px] overflow-hidden flex flex-col items-center justify-center p-8 text-center animate-fade-up">
                            {/* Backdrop blurred heavy */}
                            <div className="absolute inset-0 bg-[#05060f]/80 backdrop-blur-md"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mb-6 shadow-[0_0_32px_rgba(124,58,237,0.4)]" />
                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">AI is analyzing your ticket</h3>
                                <p className="text-violet-300 font-medium tracking-wide mb-1">
                                    Gemini 2.5 Flash is classifying category and priority...
                                </p>
                                <p className="text-slate-400 text-sm">
                                    This usually takes 2-4 seconds setup via @Async ThreadPoolTaskExecutor
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default TicketCreate;
