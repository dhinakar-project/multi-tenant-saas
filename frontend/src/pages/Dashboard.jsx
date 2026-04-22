import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import api, { setClerkTokenGetter } from '../api/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ErrorCard from '../components/ErrorCard';
import VoiceAssistant from '../components/VoiceAssistant';
import SkeletonCard, { SkeletonList, SkeletonTable } from '../components/SkeletonCard';
import AdminModeModal from '../components/admin/AdminModeModal';

function Dashboard() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { tenantSlug, tenantName, userRole, isAdmin, isBootstrapping, bootstrapError } = useTenant();
    const location = useLocation();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminModalVariant, setAdminModalVariant] = useState('confirm');

    const handleAdminClick = (e) => {
        e.preventDefault();
        if (isAdmin) {
            setAdminModalVariant('confirm');
        } else {
            setAdminModalVariant('restricted');
        }
        setShowAdminModal(true);
    };

    const handleAdminConfirm = () => {
        setShowAdminModal(false);
        navigate('/admin');
    };

    // Inject Clerk token getter into API interceptor
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            setClerkTokenGetter(getToken);
        }
    }, [isLoaded, isSignedIn, getToken]);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchTickets();
        }
    }, [isLoaded, isSignedIn]);

    const fetchTickets = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/tickets');
            setTickets(res.data.content || res.data || []);
        } catch (e) {
            console.error('Failed to fetch tickets:', e);
            setError(e.response?.data?.message || e.message || 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    // States
    if (!isLoaded) {
        return (
            <div className="p-8 max-w-4xl mx-auto mt-10">
                <SkeletonList count={3} lines={4} />
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass-card-dark p-6"><p className="text-yellow-500">Not signed in.</p></div>
            </div>
        );
    }

    if (isBootstrapping) {
        return (
            <div className="flex items-center flex-col justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium tracking-wide">Provisioning your tenant workspace...</p>
            </div>
        );
    }

    if (bootstrapError) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass-card-dark p-8 border-red-500/20 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-4">Setup Error</h2>
                    <p className="text-slate-300 mb-6">{bootstrapError}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full">Retry</button>
                </div>
            </div>
        );
    }

    if (!tenantSlug) {
        return (
            <div className="p-8 max-w-4xl mx-auto mt-10">
                <SkeletonList count={3} lines={4} />
            </div>
        );
    }

    const aiSuccessRate = tickets.length > 0 
        ? Math.round(tickets.filter(t => t.aiCategory).length / tickets.length * 100)
        : 0;

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
        <div className="animate-fade-up">

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 1: HERO WELCOME BANNER — Horizontal Split Layout      */}
            {/* ──────────────────────────────────────────────────────────── */}
            <section className="mb-16">
                <div className="glass-card relative overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(10,10,30,0.95) 0%, rgba(20,15,50,0.95) 100%)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 20,
                    padding: '48px 56px',
                }}>
                    {/* Background ambient glows */}
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }}></div>
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', transform: 'translate(20%, 30%)' }}></div>

                    {/* Two-column grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'center', position: 'relative', zIndex: 10 }}>

                        {/* ── LEFT: Text + CTAs ── */}
                        <div>
                            {/* Badge */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 14px', borderRadius: 999,
                                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
                                color: '#a5b4fc', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
                                marginBottom: 20,
                            }}>
                                <span style={{ color: '#818cf8' }}>✦</span> AI-Powered Ticket Management
                            </div>

                            {/* Heading */}
                            <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, lineHeight: 1.15, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                                Welcome back,{' '}
                                <span style={{ background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    {tenantName || tenantSlug}
                                </span>!
                            </h1>

                            {/* Subtitle */}
                            <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.65, margin: '0 0 32px', maxWidth: 480 }}>
                                Your workspace is running smoothly. Tracking {tickets.length} tickets across your organization with native Gemini AI integration.
                            </p>

                            {/* CTA Buttons */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate('/tickets/new')}
                                    style={{
                                        padding: '11px 28px', borderRadius: 10, border: 'none',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: '#fff', fontWeight: 700, fontSize: 14,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                        boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
                                        transition: 'transform 200ms, box-shadow 200ms',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.6)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.45)'; }}
                                >
                                    Create Ticket <span style={{ opacity: 0.8 }}>→</span>
                                </button>

                                {isAdmin && (
                                    <button
                                        onClick={handleAdminClick}
                                        style={{
                                            padding: '11px 28px', borderRadius: 10,
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            background: 'rgba(255,255,255,0.06)', color: '#cbd5e1',
                                            fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                            transition: 'all 200ms',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#cbd5e1'; }}
                                    >
                                        View Admin Console
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── RIGHT: Robot Avatar + Voice Button + Status ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 220 }}>
                            {/* AI Voice Assistant Label */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 12px', borderRadius: 999, marginBottom: 14,
                                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                                color: '#a5b4fc', fontSize: 11, fontWeight: 600,
                            }}>
                                <span style={{ fontSize: 10 }}>✦</span> AI Voice Assistant
                            </div>

                            {/* Glowing Robot Orb */}
                            <div
                                style={{ position: 'relative', width: 200, height: 200, cursor: 'pointer', flexShrink: 0 }}
                                onClick={() => document.querySelector('[title="Chat with AI"]')?.click()}
                            >
                                {/* Outer glow ring */}
                                <div style={{
                                    position: 'absolute', inset: -8,
                                    borderRadius: '50%',
                                    background: 'conic-gradient(from 0deg, rgba(99,102,241,0.6), rgba(139,92,246,0.15), rgba(59,130,246,0.5), rgba(99,102,241,0.6))',
                                    animation: 'spin 6s linear infinite',
                                    filter: 'blur(2px)',
                                }}></div>
                                {/* Dark ring separator */}
                                <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: 'rgba(10,10,30,0.95)' }}></div>
                                {/* Robot container */}
                                <div style={{
                                    position: 'relative', width: '100%', height: '100%',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle at 35% 35%, rgba(30,27,75,1) 0%, rgba(10,10,30,1) 100%)',
                                    border: '1px solid rgba(99,102,241,0.25)',
                                    boxShadow: '0 0 60px rgba(99,102,241,0.4), inset 0 0 40px rgba(99,102,241,0.08)',
                                    overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    animation: 'robotHover 4s ease-in-out infinite',
                                }}>
                                    {/* Inner gradient overlay */}
                                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 40%, rgba(99,102,241,0.15) 0%, transparent 60%)' }}></div>
                                    <img
                                        src="/ai_robot_avatar.png"
                                        alt="AI Agent"
                                        style={{ width: '88%', height: '88%', objectFit: 'contain', position: 'relative', filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.7))' }}
                                    />
                                    {/* Glowing dots on ring */}
                                    <div style={{ position: 'absolute', top: 12, right: 18, width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }}></div>
                                    <div style={{ position: 'absolute', bottom: 20, left: 14, width: 6, height: 6, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8' }}></div>
                                </div>
                            </div>

                            {/* Talk to AI Button */}
                            <button
                                onClick={() => document.querySelector('[title="Chat with AI"]')?.click()}
                                style={{
                                    marginTop: 18, padding: '10px 22px', borderRadius: 999,
                                    border: '1px solid rgba(99,102,241,0.35)',
                                    background: 'rgba(15,15,40,0.8)', color: '#c4b5fd',
                                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    boxShadow: '0 0 20px rgba(99,102,241,0.15)',
                                    transition: 'all 200ms', backdropFilter: 'blur(8px)',
                                    width: '100%', justifyContent: 'center',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,15,40,0.8)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.15)'; }}
                            >
                                <svg style={{ width: 15, height: 15, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                                </svg>
                                Talk to AI Assistant
                            </button>

                            {/* Status pills — vertical stack under avatar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, alignSelf: 'stretch' }}>
                                {[
                                    { dot: '#4ade80', text: 'AI Categorization Active' },
                                    { dot: '#a78bfa', text: 'Voice Powered by Gemini' },
                                    { dot: '#60a5fa', text: 'Real-time Data' },
                                ].map(({ dot, text }) => (
                                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, boxShadow: `0 0 6px ${dot}`, flexShrink: 0 }}></div>
                                        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 2: METRICS ROW (4 stat cards)                        */}
            {/* ──────────────────────────────────────────────────────────── */}
            <section className="mb-20">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    <div className="glass-card p-6 animate-fade-up cursor-default hover:bg-slate-800/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-16 h-16 text-violet-400" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 border border-violet-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <p className="text-4xl font-extrabold text-white mb-1 tracking-tight">{tickets.length}</p>
                        <p className="text-slate-400 text-sm font-medium mb-3">Total Tickets</p>
                        <div className="badge badge-ai inline-flex gap-1 items-center">
                            <span>+{tickets.length}</span> <span className="opacity-80 font-normal">this session</span>
                        </div>
                    </div>

                    <div className="glass-card p-6 animate-fade-up cursor-default hover:bg-slate-800/40 relative overflow-hidden group" style={{ animationDelay: '100ms' }}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-16 h-16 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <p className="text-4xl font-extrabold text-white mb-1 tracking-tight">{tickets.filter(t => t.status === 'Open').length}</p>
                        <p className="text-slate-400 text-sm font-medium mb-3">Open Tickets</p>
                        <div className="badge badge-open">Requires action</div>
                    </div>

                    <div className="glass-card p-6 animate-fade-up cursor-default hover:bg-slate-800/40 relative overflow-hidden group" style={{ animationDelay: '200ms' }}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-16 h-16 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                            <span className="text-2xl">✨</span>
                        </div>
                        <p className="text-4xl font-extrabold text-white mb-1 tracking-tight">{tickets.filter(t => t.aiCategory).length}</p>
                        <p className="text-slate-400 text-sm font-medium mb-3">AI Categorized</p>
                        <div className="badge badge-ai bg-blue-500/20 text-blue-300 border-blue-500/30">{aiSuccessRate}% success rate</div>
                    </div>

                    <div className="glass-card p-6 animate-fade-up cursor-default hover:bg-slate-800/40 relative overflow-hidden group" style={{ animationDelay: '300ms' }}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-16 h-16 text-orange-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4 border border-orange-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <p className="text-4xl font-extrabold text-white mb-1 tracking-tight">{tickets.filter(t => ['High', 'Urgent', 'Critical'].includes(t.priority)).length}</p>
                        <p className="text-slate-400 text-sm font-medium mb-3">High Priority</p>
                        <div className="badge badge-urgent">Needs attention</div>
                    </div>

                </div>
            </section>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 3: FEATURE HIGHLIGHTS ROW                            */}
            {/* ──────────────────────────────────────────────────────────── */}
            <section className="mb-20">
                <div className="mb-8">
                    <h2 className="text-white text-3xl font-bold tracking-tight mb-2">Platform Capabilities</h2>
                    <p className="text-slate-400 text-base">Enterprise-grade multi-tenant architecture with AI-powered automation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <div className="glass-card p-6 group cursor-default hover:bg-[rgba(255,255,255,0.06)]">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-2xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-violet-500/20">🏢</div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-violet-300 transition-colors">Multi-Tenant Architecture</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                            Complete data isolation per organization using Hibernate row-level filters and X-Tenant-Slug header identification.
                        </p>
                        <span className="badge badge-ai border-dashed">Hibernate @Filter</span>
                    </div>

                    <div className="glass-card p-6 group cursor-default hover:bg-[rgba(255,255,255,0.06)]">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-blue-500/20">🤖</div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-300 transition-colors">Gemini AI Integration</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                            Tickets are automatically classified by category, priority, and confidence score using Google Gemini 2.5 Flash in an async background thread.
                        </p>
                        <span className="badge badge-inprogress border-dashed font-mono">gemini-2.5-flash</span>
                    </div>

                    <div className="glass-card p-6 group cursor-default hover:bg-[rgba(255,255,255,0.06)]">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-emerald-500/20">🔐</div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-emerald-300 transition-colors">Zero-Trust Auth</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                            RS256 JWT validation against Clerk JWKS endpoint. No passwords stored. Auto-provision users on first login.
                        </p>
                        <span className="badge badge-open border-dashed">RS256 JWT</span>
                    </div>

                    <div className="glass-card p-6 group cursor-default hover:bg-[rgba(255,255,255,0.06)]">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-amber-500/20">📊</div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-amber-300 transition-colors">3-Layer RBAC</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                            Route guard → @PreAuthorize → Component self-protection. TENANT_ADMIN and MEMBER roles managed per-tenant in user_tenants junction table.
                        </p>
                        <span className="badge badge-medium border-dashed">Spring Security</span>
                    </div>

                    <div className="glass-card p-6 group cursor-default hover:bg-[rgba(255,255,255,0.06)]">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-2xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-pink-500/20">📋</div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-pink-300 transition-colors">Full Audit Trail</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                            Every create, update, assign, and status change is logged with actor, IP address, entity type, and timestamp.
                        </p>
                        <span className="badge !text-pink-400 !bg-pink-500/10 !border-pink-500/30 border-dashed">AuditLogService</span>
                    </div>

                    <div className="glass-card p-6 group cursor-default hover:bg-[rgba(255,255,255,0.06)]">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-cyan-500/20">📨</div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-300 transition-colors">Secure Invite Flow</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                            Time-limited token-based invites with role assignment. Admins generate links, users join via /join endpoint.
                        </p>
                        <span className="badge !text-cyan-400 !bg-cyan-500/10 !border-cyan-500/30 border-dashed">TenantInvite</span>
                    </div>

                </div>
            </section>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 4: TECH STACK BANNER                                 */}
            {/* ──────────────────────────────────────────────────────────── */}
            <section className="mb-20">
                <div className="glass-card p-8 flex flex-col lg:flex-row justify-between items-center gap-6 border-b-2 border-b-violet-500/30">
                    <div>
                        <h3 className="text-white font-bold text-xl mb-1 tracking-tight">Built with modern enterprise stack</h3>
                        <p className="text-slate-400 text-sm">Production-ready architecture used by real SaaS companies</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-end">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-violet-500/30 text-violet-300 bg-violet-500/10">Spring Boot 3.2</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-500/30 text-blue-300 bg-blue-500/10">React 18</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-500/30 text-orange-300 bg-orange-500/10">MySQL 8</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">Clerk Auth</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-pink-500/30 text-pink-300 bg-pink-500/10">Gemini AI</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-500/30 text-cyan-300 bg-cyan-500/10">Docker</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/30 text-amber-300 bg-amber-500/10">Flyway</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-violet-500/30 text-violet-300 bg-violet-500/10">Tailwind CSS</span>
                    </div>
                </div>
            </section>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 5: TICKETS TABLE (scrollable)                        */}
            {/* ──────────────────────────────────────────────────────────── */}
            <section className="mb-24" id="tickets-table">
                
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Your Tickets</h2>
                        <span className="text-slate-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                            Live data for {tenantName || tenantSlug}
                        </span>
                    </div>
                    <button onClick={() => navigate('/tickets/new')} className="btn-primary space-x-1 shadow-[0_4px_24px_rgba(124,58,237,0.4)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.6)]">
                        <span className="text-lg font-normal leading-none mb-[2px]">+</span>
                        <span>New Ticket</span>
                    </button>
                </div>

                {error && (
                    <div className="glass-card p-6 border-red-500/30 bg-red-900/10 mb-6 flex flex-col items-center">
                        <p className="text-red-400 font-medium mb-3">Error: {error}</p>
                        <button onClick={fetchTickets} className="btn-secondary text-xs">Retry Fetch</button>
                    </div>
                )}

                <div className="glass-card overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/[0.08]">
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] w-12 text-center">#</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Title</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Status</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Priority</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">AI Category</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Created</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                
                                {loading && !error && (
                                    <tr>
                                        <td colSpan="7" className="p-0 border-b border-white/[0.04]">
                                            <div className="p-4">
                                                <SkeletonTable rows={5} />
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && tickets.length === 0 && (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="py-24 flex flex-col items-center justify-center relative overflow-hidden">
                                                <span className="text-7xl opacity-20 mb-6 drop-shadow-2xl">🎫</span>
                                                <h3 className="text-white text-2xl font-bold mb-2 tracking-tight">No tickets yet</h3>
                                                <p className="text-slate-400 max-w-sm text-center mb-8">
                                                    Your workspace is empty! Create your first ticket to see the AI categorization in action.
                                                </p>
                                                <button onClick={() => navigate('/tickets/new')} className="btn-primary w-48 shadow-[0_0_24px_rgba(124,58,237,0.3)]">
                                                    Create Your First Ticket
                                                </button>
                                                
                                                <div className="absolute inset-0 bg-gradient-to-t from-violet-600/5 to-transparent pointer-events-none"></div>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && tickets.map((t, idx) => (
                                    <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group">
                                        
                                        <td className="py-4 px-6 text-xs text-slate-600 font-mono text-center">
                                            {idx + 1}
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-200 font-medium text-[14px] group-hover:text-white transition-colors">{t.title}</span>
                                                {t.aiCategory && (
                                                    <span className="badge badge-ai !text-[9px] !px-1.5 !py-0 border-dashed tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity">AI Tagged</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={`badge ${statusColors[t.status] || 'badge-low'}`}>{t.status}</span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={`badge ${priorityColors[t.priority] || 'badge-low'}`}>{t.priority}</span>
                                        </td>

                                        <td className="py-4 px-6">
                                            {t.aiCategory ? (
                                                <span className="badge badge-ai border-dashed">{t.aiCategory}</span>
                                            ) : t.aiStatus === 'PENDING' ? (
                                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                    <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                                    <span className="italic">analyzing</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 font-medium">—</span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-slate-400 text-[13px] font-medium tracking-wide">
                                            {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>

                                        <td className="py-4 px-6 text-right">
                                            <Link to={`/tickets/${t.id}`} className="text-violet-400 hover:text-violet-300 font-semibold text-[13px] tracking-wide inline-flex items-center gap-1 opacity-80 hover:opacity-100 transition-all group-hover:translate-x-1 duration-300">
                                                View <span className="text-[10px] mt-[1px]">→</span>
                                            </Link>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 6: HOW IT WORKS                                      */}
            {/* ──────────────────────────────────────────────────────────── */}
            <section className="mb-24 relative">
                <div className="text-center mb-14">
                    <h2 className="text-white text-3xl font-bold tracking-tight mb-3">How It Works</h2>
                    <p className="text-slate-400 text-base max-w-xl mx-auto">From sign-up to AI-categorized tickets in minutes. A streamlined SaaS experience.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    
                    {/* Connectors (Desktop only) */}
                    <div className="hidden lg:block absolute top-16 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-slate-700/50 -z-10"></div>

                    <div className="glass-card p-8 text-center relative group overflow-hidden">
                        <div className="absolute top-4 right-5 text-white/[0.04] text-7xl font-black italic select-none group-hover:scale-110 group-hover:text-white/[0.08] transition-all duration-500">1</div>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(99,102,241,0.1)] border border-indigo-500/30">🚀</div>
                        <h3 className="text-white font-bold text-lg mb-4">Register Organization</h3>
                        <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                            Sign up and get an isolated tenant workspace with unique slug-based identification for your entire company.
                        </p>
                    </div>

                    <div className="glass-card p-8 text-center relative group overflow-hidden">
                        <div className="absolute top-4 right-5 text-white/[0.04] text-7xl font-black italic select-none group-hover:scale-110 group-hover:text-white/[0.08] transition-all duration-500">2</div>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(59,130,246,0.1)] border border-blue-500/30">👥</div>
                        <h3 className="text-white font-bold text-lg mb-4">Invite Your Team</h3>
                        <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                            Generate secure token-based invite links from the Admin Console with specific role assignments.
                        </p>
                    </div>

                    <div className="glass-card p-8 text-center relative group overflow-hidden">
                        <div className="absolute top-4 right-5 text-white/[0.04] text-7xl font-black italic select-none group-hover:scale-110 group-hover:text-white/[0.08] transition-all duration-500">3</div>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(16,185,129,0.1)] border border-emerald-500/30">🎫</div>
                        <h3 className="text-white font-bold text-lg mb-4">Create & Track Tickets</h3>
                        <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                            Submit tickets with detailed descriptions. Track progress, status changes, and add comments seamlessly.
                        </p>
                    </div>

                    <div className="glass-card p-8 text-center relative group overflow-hidden">
                        <div className="absolute top-4 right-5 text-white/[0.04] text-7xl font-black italic select-none group-hover:scale-110 group-hover:text-white/[0.08] transition-all duration-500">4</div>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 flex items-center justify-center text-3xl shadow-[0_0_32px_rgba(139,92,246,0.2)] border border-violet-500/30">🧠</div>
                        <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-bold text-lg mb-4">AI Heavy Lifting</h3>
                        <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                            Gemini Flash analyzes each ticket and returns a category, priority suggestion, confidence score, and reasoning automatically.
                        </p>
                    </div>

                </div>
            </section>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 7: SECURITY & ARCHITECTURE INFO                      */}
            {/* ──────────────────────────────────────────────────────────── */}
            <section className="mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Security Model Card */}
                    <div className="glass-card p-8 bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] bg-opacity-[0.03]">
                        <h3 className="text-white text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                            <span className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 border border-emerald-500/30 text-xl">🔒</span> 
                            Security Model
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "JWT RS256 validation via Clerk JWKS endpoint",
                                "Row-level tenant isolation via Hibernate @Filter",
                                "Per-tenant roles in user_tenants junction table",
                                "CSRF disabled, stateless Spring Security config",
                                "Auto-provisioned users on first Clerk login"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span className="text-slate-300 text-[15px] leading-relaxed tracking-wide">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Architecture Card */}
                    <div className="glass-card p-8 bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] bg-opacity-[0.03]">
                        <h3 className="text-white text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                            <span className="bg-violet-500/20 p-2 rounded-lg text-violet-400 border border-violet-500/30 text-xl">🏗️</span> 
                            Architecture
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "Shared DB, isolated rows — scalable to N tenants",
                                "Async Gemini AI via @Async ThreadPoolTaskExecutor",
                                "TenantContext ThreadLocal cleared after each request",
                                "12 Flyway migrations for zero-downtime deploys",
                                "Docker Compose: MySQL + Spring Boot + React/nginx"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    <span className="text-slate-300 text-[15px] leading-relaxed tracking-wide">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </section>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SECTION 8: FOOTER                                            */}
            {/* ──────────────────────────────────────────────────────────── */}
            <footer className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left border-t border-t-violet-500/20 mt-10">
                <div className="text-slate-400 text-sm font-medium tracking-wide">
                    <span className="text-violet-400 mr-2 text-base align-middle">◆</span>
                    <strong className="text-slate-300 mr-2">SaaS Tickets</strong> 
                    <span className="opacity-60 hidden sm:inline">| Multi-Tenant AI-Powered Ticketing Platform</span>
                </div>
                
                <div className="text-slate-500 text-xs tracking-wider uppercase font-semibold">
                    Built with Spring Boot 3 · React 18 · Gemini AI · Clerk · MySQL 8
                </div>
            </footer>

            {showAdminModal && (
                <AdminModeModal
                    variant={adminModalVariant}
                    onConfirm={handleAdminConfirm}
                    onClose={() => setShowAdminModal(false)}
                />
            )}
        </div>
    );
}

export default Dashboard;
