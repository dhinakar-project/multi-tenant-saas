import React from 'react';

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'invites', label: 'Invites', icon: '📨' },
    { id: 'audit', label: 'Audit Logs', icon: '🧾' },
    { id: 'settings', label: 'Tenant Settings', icon: '⚙️' },
];

/**
 * AdminSidebar — Left nav for the Admin Console.
 * Props: activeTab (string), onTabChange (fn)
 */
function AdminSidebar({ activeTab, onTabChange }) {
    return (
        <aside style={{
            width: 232,
            flexShrink: 0,
            background: 'rgba(8, 12, 28, 0.92)',
            borderRight: '1px solid rgba(251,191,36,0.12)',
            borderRadius: '16px 0 0 16px',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'slideInLeft 280ms cubic-bezier(0.22,1,0.36,1) both',
            minHeight: '100%',
        }}>
            {/* Sidebar header label */}
            <div style={{ padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                    Control Panel
                </p>
            </div>

            {NAV_ITEMS.map(item => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 20px',
                            margin: '0 8px',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            background: isActive ? 'rgba(251,191,36,0.10)' : 'transparent',
                            borderLeft: isActive ? '3px solid #fbbf24' : '3px solid transparent',
                            color: isActive ? '#fbbf24' : '#94a3b8',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 14,
                            textAlign: 'left',
                            transition: 'all 150ms ease',
                            width: 'calc(100% - 16px)',
                        }}
                        onMouseEnter={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.color = '#cbd5e1';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                            }
                        }}
                    >
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        {item.label}
                    </button>
                );
            })}

            {/* Bottom version tag */}
            <div style={{ marginTop: 'auto', padding: '16px 20px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#334155', fontSize: 11, margin: 0 }}>Admin Console v1.0</p>
            </div>
        </aside>
    );
}

export default AdminSidebar;
