import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import api, { setClerkTokenGetter } from '../api/api';
import { useTenant } from '../context/TenantContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import StatCard from '../components/admin/StatCard';
import AuditTimeline from '../components/admin/AuditTimeline';
import RoleBadge from '../components/admin/RoleBadge';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SectionHeading({ children }) {
    return (
        <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
            {children}
        </h2>
    );
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────
function OverviewPanel({ users, logs }) {
    const openTickets = 0; // Derive from ticket API if needed; summary for now
    return (
        <div style={{ animation: 'fadeInUp 240ms ease both' }}>
            <SectionHeading>📊 Organization Overview</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <StatCard icon="👥" label="Total Users" value={users.length} accent="#6366f1" />
                <StatCard icon="🟢" label="Active Users" value={users.filter(u => u.active).length} accent="#22c55e" />
                <StatCard icon="🧾" label="Audit Events" value={logs.length} accent="#f59e0b" />
                <StatCard icon="🔐" label="Admins" value={users.filter(u => u.role === 'TENANT_ADMIN').length} accent="#fbbf24" />
                <StatCard icon="👤" label="Members" value={users.filter(u => u.role !== 'TENANT_ADMIN').length} accent="#60a5fa" />
            </div>

            <SectionHeading>🕐 Recent Activity</SectionHeading>
            <div style={{
                background: 'rgba(15,23,42,0.6)', borderRadius: 12,
                border: '1px solid rgba(99,102,241,0.15)', overflow: 'hidden',
            }}>
                <AuditTimeline logs={logs.slice(0, 8)} />
            </div>
        </div>
    );
}

function UsersPanel({ users, onRefresh }) {
    return (
        <div style={{ animation: 'fadeInUp 240ms ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <SectionHeading>👥 Organization Members</SectionHeading>
                <button
                    onClick={onRefresh}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)',
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', transition: 'all 150ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                >
                    ↻ Refresh
                </button>
            </div>

            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(15,23,42,0.8)' }}>
                            {['Email', 'Full Name', 'Role', 'Status'].map(h => (
                                <th key={h} style={{
                                    padding: '12px 16px', textAlign: 'left', fontSize: 11,
                                    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                                    color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                                    No users found.
                                </td>
                            </tr>
                        ) : users.map((u, idx) => (
                            <tr
                                key={u.id}
                                style={{
                                    background: idx % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.2)',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    transition: 'background 120ms',
                                    animation: `fadeInUp 250ms ease ${Math.min(idx * 30, 300)}ms both`,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.2)'}
                            >
                                <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: 14 }}>{u.email}</td>
                                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 14 }}>{u.fullName || '—'}</td>
                                <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role || 'MEMBER'} /></td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                                        background: u.active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                        color: u.active ? '#4ade80' : '#f87171',
                                        border: `1px solid ${u.active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    }}>
                                        {u.active ? '● Active' : '○ Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function InvitesPanel({ inviteRequest, setInviteRequest, onGenerateInvite, generatedInviteLink, tenantName, userRole }) {
    const handleSendViaGmail = () => {
        const org = tenantName || 'our organization';
        const role = inviteRequest.role || userRole || 'MEMBER';
        const subject = `You're invited to join ${org}`;
        const body =
            `Hello,

You have been invited to join the organization "${org}".

Your assigned role: ${role}

Click the link below to join:
${generatedInviteLink}

If you do not yet have an account, please sign up via Clerk first.

Best regards,
${org} Team`;

        const gmailUrl =
            `https://mail.google.com/mail/?view=cm&fs=1` +
            `&to=${encodeURIComponent(inviteRequest.email)}` +
            `&su=${encodeURIComponent(subject)}` +
            `&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    };

    return (
        <div style={{ animation: 'fadeInUp 240ms ease both' }}>
            <SectionHeading>📨 Invite User to Organization</SectionHeading>
            <div style={{
                background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 24,
                border: '1px solid rgba(99,102,241,0.15)', marginBottom: 24,
            }}>
                <p style={{ color: '#64748b', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
                    Users must sign up via Clerk before accepting the invite link.
                </p>
                <form onSubmit={onGenerateInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 160px', gap: 12, alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Email Address
                        </label>
                        <input
                            type="email" required
                            value={inviteRequest.email}
                            placeholder="colleague@company.com"
                            onChange={e => setInviteRequest({ ...inviteRequest, email: e.target.value })}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
                                transition: 'border-color 150ms',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Role
                        </label>
                        <select
                            value={inviteRequest.role}
                            onChange={e => setInviteRequest({ ...inviteRequest, role: e.target.value })}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#e2e8f0', outline: 'none', cursor: 'pointer',
                            }}
                        >
                            <option value="MEMBER">MEMBER</option>
                            <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                            transition: 'box-shadow 150ms, transform 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'none'; }}
                    >
                        Generate Link
                    </button>
                </form>

                {/* Generated link display */}
                {generatedInviteLink && (
                    <div style={{
                        marginTop: 20, padding: 16, borderRadius: 10,
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                        animation: 'fadeInUp 200ms ease both',
                    }}>
                        <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, margin: '0 0 10px', letterSpacing: '0.04em' }}>
                            ✓ INVITE LINK GENERATED
                        </p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                readOnly value={generatedInviteLink}
                                style={{
                                    flex: 1, padding: '8px 12px', borderRadius: 7, fontSize: 13,
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#94a3b8', outline: 'none',
                                }}
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedInviteLink)}
                                style={{
                                    padding: '8px 16px', borderRadius: 7, border: 'none',
                                    background: 'rgba(99,102,241,0.25)', color: '#818cf8',
                                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    transition: 'background 150ms', whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.4)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                            >
                                Copy
                            </button>
                            <button
                                onClick={handleSendViaGmail}
                                style={{
                                    padding: '8px 14px', borderRadius: 7, border: 'none',
                                    background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    transition: 'background 150ms', whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.35)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                            >
                                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#fca5a5' }}>
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                </svg>
                                Send via Gmail
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AuditPanel({ logs }) {
    return (
        <div style={{ animation: 'fadeInUp 240ms ease both' }}>
            <SectionHeading>🧾 Audit Log</SectionHeading>
            <div style={{
                background: 'rgba(15,23,42,0.6)', borderRadius: 12,
                border: '1px solid rgba(99,102,241,0.12)', overflow: 'hidden',
            }}>
                <AuditTimeline logs={logs} />
            </div>
        </div>
    );
}

function SettingsPanel({ tenantName, tenantSlug }) {
    return (
        <div style={{ animation: 'fadeInUp 240ms ease both' }}>
            <SectionHeading>⚙️ Tenant Settings</SectionHeading>
            <div style={{
                background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 28,
                border: '1px solid rgba(99,102,241,0.12)',
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {[
                        { label: 'Organization Name', value: tenantName || '—' },
                        { label: 'Tenant Slug', value: tenantSlug || '—' },
                        { label: 'Plan', value: 'Enterprise (Demo)' },
                        { label: 'Isolation Mode', value: 'Hibernate Multi-Tenant' },
                        { label: 'Authentication', value: 'Clerk (JWT)' },
                        { label: 'Audit Logging', value: 'Enabled' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{
                            padding: '16px 20px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <p style={{ color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                                {label}
                            </p>
                            <p style={{ color: '#cbd5e1', fontSize: 15, fontWeight: 600, margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>
                <p style={{ color: '#334155', fontSize: 12, marginTop: 24, marginBottom: 0 }}>
                    ℹ️ Configuration changes are managed through the backend and Clerk dashboard.
                </p>
            </div>
        </div>
    );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
function Admin() {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const { isAdmin, tenantName, tenantSlug, userRole } = useTenant();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [inviteRequest, setInviteRequest] = useState({ email: '', role: 'MEMBER' });
    const [generatedInviteLink, setGeneratedInviteLink] = useState(null);

    useEffect(() => { setClerkTokenGetter(getToken); }, [getToken]);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
            fetchLogs();
        }
    }, [isAdmin]);

    // ─── Layer 3: Component Self-Protection ──────────────────────────────────
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="glass-card-light p-10 max-w-md w-full text-center">
                    <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-red-50 border-2 border-red-100">
                        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                    <p className="text-gray-500 mb-1">You do not have permission to view this page.</p>
                    <p className="text-sm text-gray-400 mb-8">This area is restricted to <span className="font-semibold text-indigo-600">Tenant Administrators</span> only.</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">Back to Dashboard</button>
                </div>
            </div>
        );
    }
    // ────────────────────────────────────────────────────────────────────────

    const fetchUsers = async () => {
        try { const r = await api.get('/users'); setUsers(r.data); } catch (_) { }
    };
    const fetchLogs = async () => {
        try { const r = await api.get('/audit-logs'); setLogs(r.data); } catch (_) { }
    };
    const handleGenerateInvite = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/invites', inviteRequest);
            const joinUrl = `${window.location.origin}/join?token=${res.data.token}`;
            setGeneratedInviteLink(joinUrl);
            setInviteRequest({ email: '', role: 'MEMBER' });
        } catch (_) {
            alert('Failed to generate invite');
        }
    };

    const renderPanel = () => {
        switch (activeTab) {
            case 'overview': return <OverviewPanel users={users} logs={logs} />;
            case 'users': return <UsersPanel users={users} onRefresh={fetchUsers} />;
            case 'invites': return (
                <InvitesPanel
                    inviteRequest={inviteRequest}
                    setInviteRequest={setInviteRequest}
                    onGenerateInvite={handleGenerateInvite}
                    generatedInviteLink={generatedInviteLink}
                    tenantName={tenantName}
                    userRole={userRole}
                />
            );
            case 'audit': return <AuditPanel logs={logs} />;
            case 'settings': return <SettingsPanel tenantName={tenantName} tenantSlug={tenantSlug} />;
            default: return null;
        }
    };

    return (
        <div style={{ animation: 'fadeInUp 300ms ease both' }}>
            {/* ── Admin Mode Banner ─────────────────────────────── */}
            <div className="admin-mode-banner" style={{ marginBottom: 12 }}>
                <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: '#fbbf24', boxShadow: '0 0 8px #fbbf24', flexShrink: 0,
                }} />
                <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Admin Mode Active
                </span>
                <span style={{ color: '#92400e', fontSize: 12 }}>
                    — Organization Control Panel for <strong style={{ color: '#fbbf24' }}>{tenantName || tenantSlug}</strong>
                </span>
                <span style={{ marginLeft: 'auto', color: '#78716c', fontSize: 11 }}>
                    Breadcrumb: Admin Console › Organization Control
                </span>
            </div>

            {/* ── Shell: Sidebar + Content ──────────────────────── */}
            <div className="admin-shell">
                <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="admin-content">
                    {renderPanel()}
                </div>
            </div>
        </div>
    );
}

export default Admin;
