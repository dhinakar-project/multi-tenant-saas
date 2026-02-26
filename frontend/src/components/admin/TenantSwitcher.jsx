import React, { useState, useRef, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';

/**
 * TenantSwitcher — Organization dropdown in the navbar.
 * Renders current tenant with a dropdown for future multi-org support.
 */
function TenantSwitcher() {
    const { tenantName, tenantSlug } = useTenant();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const displayName = tenantName || tenantSlug || 'Organization';
    const initials = displayName.slice(0, 2).toUpperCase();

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px 6px 8px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: open ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
                {/* Org avatar */}
                <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: '#fff',
                }}>
                    {initials}
                </div>
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                </span>
                {/* Chevron */}
                <svg
                    width="12" height="12" fill="none" viewBox="0 0 24 24"
                    style={{ color: '#94a3b8', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    minWidth: 220,
                    background: 'rgba(10,14,30,0.97)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 14,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 24px rgba(99,102,241,0.1)',
                    padding: '12px',
                    zIndex: 1000,
                    animation: 'fadeInUp 180ms ease both',
                }}>
                    <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>
                        Current Organization
                    </p>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px', borderRadius: 10,
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                    }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: '#fff',
                        }}>
                            {initials}
                        </div>
                        <div>
                            <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, margin: 0 }}>{displayName}</p>
                            {tenantSlug && <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{tenantSlug}</p>}
                        </div>
                        {/* Active check */}
                        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '10px 0', padding: '10px 4px 0' }}>
                        <p style={{ color: '#334155', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                            🔮 Multi-org switching coming soon
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TenantSwitcher;
