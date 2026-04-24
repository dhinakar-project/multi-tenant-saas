import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import api, { setClerkTokenGetter } from '../api/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ErrorCard from '../components/ErrorCard';
import VoiceAssistant from '../components/VoiceAssistant';
import SkeletonCard, { SkeletonList, SkeletonTable } from '../components/SkeletonCard';
import AdminModeModal from '../components/admin/AdminModeModal';
import { useTicketStore } from '../store/useTicketStore';
import { useTicketSocket } from '../hooks/useTicketSocket';

function Dashboard() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { tenantSlug, tenantName, tenantId, userRole, isAdmin, isBootstrapping, bootstrapError } = useTenant();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminModalVariant, setAdminModalVariant] = useState('confirm');

    // Zustand store — source of truth for tickets
    const { tickets, setTickets, setLoading: setStoreLoading, filters, setFilter } = useTicketStore();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('table');

    const filteredTickets = tickets
        .filter(t => statusFilter === 'all' || t.status === statusFilter)
        .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

    // WebSocket real-time updates (safe no-op if backend doesn't have WS yet)
    useTicketSocket(tenantId);

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
            const data = res.data.content || res.data || [];
            setTickets(data);
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
        <div className="page-enter">

            {/* ── Hero Banner (compact) ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(99,102,241,0.08) 50%, rgba(16,185,129,0.06) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 20,
              padding: '28px 36px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Background grid texture */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.03,
                backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                pointerEvents: 'none',
              }} />

              {/* Left: text */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Pill badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: 20, padding: '4px 12px', marginBottom: 14,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                  <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>AI-Powered Ticket Management</span>
                </div>

                <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                  Welcome back, <span style={{
                    background: 'linear-gradient(135deg, #a78bfa, #818cf8, #38bdf8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>{tenantName || 'your workspace'}</span>
                </h1>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 15, lineHeight: 1.5, maxWidth: 420 }}>
                  {tickets.length} tickets tracked · AI categorization active · Real-time sync enabled
                </p>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => navigate('/tickets/new')}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      color: 'white', border: 'none', borderRadius: 12,
                      padding: '11px 22px', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                      transition: 'transform 120ms, box-shadow 120ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.4)'; }}
                  >
                    + Create Ticket
                  </button>
                  <button
                    onClick={handleAdminClick}
                    style={{
                      background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                      padding: '11px 22px', fontWeight: 600, fontSize: 14,
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#f1f5f9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    Admin Console →
                  </button>
                </div>
              </div>

              {/* Right: AI Agent & Status */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1, minWidth: 260 }}>
                
                {/* AI Agent Avatar */}
                <div
                    style={{ position: 'relative', width: 180, height: 180, cursor: 'pointer', flexShrink: 0, marginTop: 12 }}
                    onClick={() => document.querySelector('[title="Chat with AI"]')?.click()}
                >
                    <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#bae6fd', backdropFilter: 'blur(4px)', zIndex: 10, whiteSpace: 'nowrap' }}>
                      ✦ AI Voice Assistant
                    </div>
                    {/* Cyan glow background */}
                    <div style={{ position: 'absolute', inset: -10, borderRadius: 40, background: 'rgba(56,189,248,0.15)', filter: 'blur(20px)', animation: 'pulse-ring 3s infinite' }}></div>
                    <img
                        src="/ai_robot_avatar.png"
                        alt="AI Assistant"
                        style={{ 
                          position: 'absolute', inset: 0, width: '100%', height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: 36, 
                          border: '2px solid rgba(56,189,248,0.5)', 
                          padding: '4px', 
                          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,27,75,0.9))', 
                          boxShadow: '0 0 25px rgba(56,189,248,0.3), inset 0 0 20px rgba(56,189,248,0.1)', 
                          transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 400ms' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(56,189,248,0.6), inset 0 0 20px rgba(56,189,248,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(56,189,248,0.3), inset 0 0 20px rgba(56,189,248,0.1)'; }}
                    />
                </div>

                <button 
                  onClick={() => document.querySelector('[title="Chat with AI"]')?.click()}
                  style={{
                    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 200ms', width: '100%', justifyContent: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e2e8f0'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  Talk to AI Assistant
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', paddingLeft: 8 }}>
                  {[
                    { label: 'AI Categorization Active', color: '#22c55e' },
                    { label: 'Voice Powered by Gemini', color: '#a78bfa' },
                    { label: 'Real-time Data', color: '#38bdf8' },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                        <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Stat Cards ── */}
            {(() => {
              const openCount = tickets.filter(t => t.status === 'Open').length;
              const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
              const aiCategorized = tickets.filter(t => t.aiCategory).length;
              const aiPct = tickets.length > 0 ? Math.round(aiCategorized / tickets.length * 100) : 0;

              const stats = [
                {
                  label: 'Total Tickets',
                  value: tickets.length,
                  sub: 'all time',
                  accent: '#818cf8',
                  glow: 'rgba(129,140,248,0.15)',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  ),
                },
                {
                  label: 'Open',
                  value: openCount,
                  sub: openCount > 0 ? 'need attention' : 'all clear',
                  accent: '#f87171',
                  glow: 'rgba(248,113,113,0.15)',
                  pulse: openCount > 0,
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  ),
                },
                {
                  label: 'In Progress',
                  value: inProgressCount,
                  sub: 'being worked on',
                  accent: '#fbbf24',
                  glow: 'rgba(251,191,36,0.15)',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ),
                },
                {
                  label: 'AI Categorized',
                  value: `${aiPct}%`,
                  sub: `${aiCategorized} of ${tickets.length} tickets`,
                  accent: '#a78bfa',
                  glow: 'rgba(167,139,250,0.15)',
                  isPercent: true,
                  pct: aiPct,
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/><circle cx="12" cy="12" r="2"/>
                    </svg>
                  ),
                },
              ];

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                  {stats.map((s, i) => (
                    <div
                      key={s.label}
                      className="glass-card"
                      style={{
                        padding: '20px 22px',
                        borderRadius: 16,
                        background: `linear-gradient(135deg, ${s.glow} 0%, rgba(255,255,255,0.02) 100%)`,
                        border: `1px solid ${s.accent}22`,
                        animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top glow accent line */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`,
                      }} />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10,
                          background: `${s.accent}18`,
                          border: `1px solid ${s.accent}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                        }}>
                          {s.icon}
                          {s.pulse && (
                            <div style={{
                              position: 'absolute', top: -3, right: -3,
                              width: 10, height: 10, borderRadius: '50%',
                              background: '#f87171',
                              boxShadow: '0 0 8px #f87171',
                              animation: 'pulse-ring 2s ease infinite',
                            }} />
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: 34, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                        {s.value}
                      </div>

                      {s.isPercent ? (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${s.pct}%`,
                              background: `linear-gradient(90deg, ${s.accent}, ${s.accent}aa)`,
                              borderRadius: 2,
                              transition: 'width 1s ease',
                            }} />
                          </div>
                        </div>
                      ) : null}

                      <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

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
                
                {/* ── Toolbar ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      placeholder="Search tickets... (⌘K)"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', padding: '10px 14px 10px 38px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {['All Status', 'Open', 'In Progress', 'Done'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setStatusFilter(opt === 'All Status' ? 'all' : opt)}
                      style={{
                        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                        background: statusFilter === (opt === 'All Status' ? 'all' : opt) ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                        color: statusFilter === (opt === 'All Status' ? 'all' : opt) ? '#a78bfa' : '#64748b',
                        border: statusFilter === (opt === 'All Status' ? 'all' : opt) ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >{opt}</button>
                  ))}

                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    {[['table','⊞'], ['kanban','☲']].map(([v, icon]) => (
                      <button key={v} onClick={() => setViewMode(v)}
                        style={{ padding: '9px 14px', border: 'none', cursor: 'pointer', fontSize: 15, transition: 'all 150ms',
                          background: viewMode === v ? 'rgba(139,92,246,0.2)' : 'transparent',
                          color: viewMode === v ? '#a78bfa' : '#64748b' }}
                      >{icon}</button>
                    ))}
                  </div>
                </div>

                {/* ── Table ── */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                        {['Ticket', 'Priority', 'Status', 'AI Category', 'Created'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📭</div>
                            <div style={{ color: '#475569', fontSize: 15, fontWeight: 500 }}>No tickets found</div>
                            <div style={{ color: '#334155', fontSize: 13, marginTop: 4 }}>Create your first ticket to get started</div>
                          </td>
                        </tr>
                      ) : filteredTickets.map((ticket, i) => {
                        const priorityStyle = {
                          High:   { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' },
                          Medium: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
                          Low:    { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
                        }[ticket.priority] || { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: 'rgba(100,116,139,0.2)' };

                        const statusStyle = {
                          'Open':        { bg: 'rgba(239,68,68,0.1)',   color: '#f87171' },
                          'In Progress': { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24' },
                          'DONE':        { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80' },
                          'TODO':        { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
                        }[ticket.status] || { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' };

                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 120ms', animation: `fadeInUp 0.3s ease ${i * 0.05}s both` }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 2 }}>{ticket.title}</div>
                              <div style={{ color: '#475569', fontSize: 12 }}>#{ticket.id?.toString().slice(-6)}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: priorityStyle.bg, color: priorityStyle.color, border: `1px solid ${priorityStyle.border}` }}>
                                {ticket.priority || 'None'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {ticket.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {ticket.aiCategory ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                                  ✦ {ticket.aiCategory}
                                </span>
                              ) : (
                                <span style={{ color: '#334155', fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#475569', fontSize: 13 }}>
                              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
