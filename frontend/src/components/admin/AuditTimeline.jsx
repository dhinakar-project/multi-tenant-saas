import React from 'react';

const ACTION_CONFIG = {
    INVITE_CREATED: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '✉️', label: 'Invite Created' },
    INVITE_ACCEPTED: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '✅', label: 'Invite Accepted' },
    TICKET_CREATED: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '🎫', label: 'Ticket Created' },
    TICKET_UPDATED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '✏️', label: 'Ticket Updated' },
    TICKET_DELETED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🗑️', label: 'Ticket Deleted' },
    USER_DISABLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🚫', label: 'User Disabled' },
    USER_JOINED: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '🙌', label: 'User Joined' },
    TENANT_BOOTSTRAP: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '🏢', label: 'Tenant Bootstrap' },
};

const DEFAULT_CONFIG = { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: '📋', label: 'Action' };

function timeAgo(dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * AuditTimeline — Vertical timeline view for audit log entries.
 * Props: logs (array)
 */
function AuditTimeline({ logs }) {
    if (!logs || logs.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#475569' }}>
                <span style={{ fontSize: 40 }}>📋</span>
                <p style={{ marginTop: 12, fontSize: 15 }}>No audit events yet.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '8px 0', position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
                position: 'absolute',
                left: 43,
                top: 0,
                bottom: 0,
                width: 2,
                background: 'rgba(99,102,241,0.15)',
                borderRadius: 1,
            }} />

            {logs.map((log, idx) => {
                const cfg = ACTION_CONFIG[log.action] || DEFAULT_CONFIG;
                return (
                    <div
                        key={log.id ?? idx}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 16,
                            padding: '14px 20px',
                            borderRadius: 12,
                            transition: 'background 150ms',
                            animation: `fadeInUp 300ms ease ${Math.min(idx * 40, 400)}ms both`,
                            position: 'relative',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        {/* Dot */}
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: cfg.bg,
                            border: `2px solid ${cfg.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            flexShrink: 0,
                            zIndex: 1,
                            boxShadow: `0 0 10px ${cfg.color}33`,
                        }}>
                            {cfg.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: 13, fontWeight: 700, color: cfg.color,
                                    background: cfg.bg, padding: '2px 8px',
                                    borderRadius: 6, border: `1px solid ${cfg.color}33`,
                                }}>
                                    {log.action}
                                </span>
                                <span style={{ color: '#64748b', fontSize: 12 }}>
                                    {log.actorEmail}
                                </span>
                            </div>
                            {log.summary && (
                                <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0', lineHeight: 1.5 }}>
                                    {log.summary}
                                </p>
                            )}
                        </div>

                        {/* Timestamp */}
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>
                                {log.createdAt ? timeAgo(log.createdAt) : ''}
                            </p>
                            <p style={{ color: '#334155', fontSize: 10, margin: '2px 0 0' }}>
                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default AuditTimeline;
