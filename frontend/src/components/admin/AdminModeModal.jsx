import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * AdminModeModal
 * variant='confirm'    → Switch to Administrative Mode? (admin flow)
 * variant='restricted' → Restricted Area (member flow)
 *
 * Props: variant, onConfirm, onClose
 */
function AdminModeModal({ variant = 'confirm', onConfirm, onClose }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 10);
        return () => clearTimeout(t);
    }, []);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(2,6,23,0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px',
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 20,
                    padding: '40px 36px',
                    maxWidth: 460,
                    width: '100%',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)',
                    transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 240ms ease',
                    transform: mounted ? 'scale(1)' : 'scale(0.88)',
                    opacity: mounted ? 1 : 0,
                }}
            >
                {variant === 'confirm' ? (
                    <>
                        {/* Shield icon */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 16,
                                background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.3))',
                                border: '1px solid rgba(251,191,36,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 24px rgba(251,191,36,0.2)',
                            }}>
                                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                                    <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.36C16.5 22.15 20 17.25 20 12V6L12 2z"
                                        fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d="M9 12l2 2 4-4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>
                            Switch to Administrative Mode?
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, textAlign: 'center', margin: '0 0 8px' }}>
                            You are about to enter <strong style={{ color: '#fbbf24' }}>organization control mode</strong>.
                        </p>
                        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, textAlign: 'center', margin: '0 0 32px' }}>
                            Actions here affect all users and resources in your tenant.
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontWeight: 600,
                                    cursor: 'pointer', fontSize: 14, transition: 'background 150ms',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                                    color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: 14,
                                    boxShadow: '0 4px 16px rgba(251,191,36,0.4)',
                                    transition: 'box-shadow 150ms, transform 150ms',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(251,191,36,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(251,191,36,0.4)'; e.currentTarget.style.transform = 'none'; }}
                            >
                                Enter Admin Mode
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Lock icon */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 16,
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 24px rgba(239,68,68,0.15)',
                            }}>
                                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                                    <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1.5" />
                                    <path d="M8 11V7a4 4 0 118 0v4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                                    <circle cx="12" cy="16" r="1.5" fill="#ef4444" />
                                </svg>
                            </div>
                        </div>

                        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>
                            Restricted Area
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, textAlign: 'center', margin: '0 0 8px' }}>
                            Only <strong style={{ color: '#ef4444' }}>Tenant Administrators</strong> can access organization management tools.
                        </p>
                        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, textAlign: 'center', margin: '0 0 32px' }}>
                            Contact your administrator to request elevated access.
                        </p>

                        <button
                            onClick={onClose}
                            style={{
                                width: '100%', padding: '12px', borderRadius: 10,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontWeight: 600,
                                cursor: 'pointer', fontSize: 14, transition: 'background 150ms',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >
                            Close
                        </button>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}

export default AdminModeModal;
