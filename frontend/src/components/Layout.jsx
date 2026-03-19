import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import AdminModeModal from './admin/AdminModeModal';
import TenantSwitcher from './admin/TenantSwitcher';
import RoleBadge from './admin/RoleBadge';
import VoiceAssistant from './VoiceAssistant';

function Layout({ children }) {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, userRole } = useTenant();

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminModalVariant, setAdminModalVariant] = useState('confirm');

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;
    const isAdminPath = location.pathname === '/admin';

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

    return (
        <div className="min-h-screen">
            <nav
                className="sticky top-0 z-50 flex items-center"
                style={{
                    height: '64px',
                    background: 'rgba(5, 6, 15, 0.6)',
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
            >
                {/* Subtle violet glow line at top border */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.8) 30%, rgba(99,102,241,0.9) 50%, rgba(139,92,246,0.8) 70%, transparent 100%)'
                }}></div>

                <div className="container-custom w-full relative z-10">
                    <div className="flex justify-between items-center h-full">
                        {/* Left: Brand + Nav Links */}
                        <div className="flex items-center gap-6">
                            <Link to="/dashboard" className="flex items-center gap-3 group" style={{ textDecoration: 'none' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 16px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    animation: 'pulse-glow 3s ease-in-out infinite'
                                }}>
                                    <span style={{ color: 'white', fontSize: '14px', lineHeight: 1 }}>◆</span>
                                </div>
                                <span style={{
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    letterSpacing: '-0.02em'
                                }}>SaaS Tickets</span>
                            </Link>

                            {isSignedIn && (
                                <div className="flex items-center gap-1 border-l border-white/10 pl-6 ml-2">
                                    <Link
                                        to="/dashboard"
                                        className="transition-all rounded-lg"
                                        style={isActive('/dashboard') ? {
                                            color: 'white',
                                            background: 'rgba(139,92,246,0.12)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            padding: '6px 12px',
                                            fontSize: '13.5px',
                                            fontWeight: 500,
                                            boxShadow: '0 0 12px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                                        } : {
                                            color: 'rgba(148,163,184,0.8)',
                                            padding: '6px 12px',
                                            fontSize: '13.5px',
                                            fontWeight: 500,
                                            border: '1px solid transparent'
                                        }}
                                        onMouseEnter={e => { if (!isActive('/dashboard')) { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}}
                                        onMouseLeave={e => { if (!isActive('/dashboard')) { e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}}
                                    >
                                        Dashboard
                                    </Link>

                                    <button
                                        onClick={handleAdminClick}
                                        className="transition-all rounded-lg flex items-center gap-2"
                                        style={isAdminPath ? {
                                            color: 'white',
                                            background: 'rgba(139,92,246,0.12)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            padding: '6px 12px',
                                            fontSize: '13.5px',
                                            fontWeight: 500,
                                            boxShadow: '0 0 12px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                                        } : {
                                            color: 'rgba(148,163,184,0.8)',
                                            padding: '6px 12px',
                                            fontSize: '13.5px',
                                            fontWeight: 500,
                                            border: '1px solid transparent'
                                        }}
                                        onMouseEnter={e => { if (!isAdminPath) { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}}
                                        onMouseLeave={e => { if (!isAdminPath) { e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}}
                                    >
                                        Admin
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Tenant switcher + user + logout */}
                        <div className="flex items-center gap-3">
                            {isSignedIn && (
                                <>
                                    <div className="flex items-center gap-3">
                                        <TenantSwitcher />
                                        
                                        {/* Divider */}
                                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 8px' }}></div>

                                        {userRole && <RoleBadge role={userRole} />}

                                        <span style={{ color: 'rgba(203,213,225,0.8)', fontSize: '13px', fontWeight: 500 }} className="hidden md:block max-w-[140px] truncate ml-1">
                                            {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User'}
                                        </span>

                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                color: 'rgba(148,163,184,0.7)',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                background: 'rgba(255,255,255,0.03)',
                                                transition: 'all 150ms ease'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                                        >
                                            Log out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container-custom py-10">
                {children}
            </main>

            {showAdminModal && (
                <AdminModeModal
                    variant={adminModalVariant}
                    onConfirm={handleAdminConfirm}
                    onClose={() => setShowAdminModal(false)}
                />
            )}

            {/* Global floating AI robot — persists across all authenticated pages */}
            {isSignedIn && <VoiceAssistant mode="dashboard" />}
        </div>
    );
}

export default Layout;
