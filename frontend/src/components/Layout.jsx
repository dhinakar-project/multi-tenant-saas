import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import AdminModeModal from './admin/AdminModeModal';
import TenantSwitcher from './admin/TenantSwitcher';
import RoleBadge from './admin/RoleBadge';

function Layout({ children }) {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, userRole } = useTenant();

    // Admin mode modal state
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
            {/* ── Top Navigation Bar ──────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 glass-card border-b border-white/10">
                <div className="container-custom">
                    <div className="flex justify-between items-center h-16">
                        {/* Left: Brand + Nav Links */}
                        <div className="flex items-center space-x-8">
                            <Link to="/dashboard" className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-sm">ST</span>
                                </div>
                                <span className="font-bold text-white text-lg drop-shadow-lg">SaaS Tickets</span>
                            </Link>

                            {isSignedIn && (
                                <div className="flex items-center space-x-1">
                                    <Link
                                        to="/dashboard"
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')
                                            ? 'bg-white/20 text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                                    >
                                        Dashboard
                                    </Link>

                                    {/* Admin nav — triggers modal, not direct navigation */}
                                    <button
                                        onClick={handleAdminClick}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${isAdminPath
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                                        style={isAdminPath ? { boxShadow: '0 0 12px rgba(251,191,36,0.2)' } : {}}
                                    >
                                        {isAdminPath && (
                                            <span style={{
                                                display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                                                background: '#fbbf24', boxShadow: '0 0 6px #fbbf24',
                                            }} />
                                        )}
                                        Admin
                                        {isAdminPath && (
                                            <span style={{
                                                fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                                                padding: '1px 5px', borderRadius: 4,
                                                background: 'rgba(251,191,36,0.25)', color: '#fbbf24',
                                                border: '1px solid rgba(251,191,36,0.35)',
                                            }}>
                                                MODE
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Tenant switcher + user + logout */}
                        <div className="flex items-center space-x-3">
                            {isSignedIn && (
                                <>
                                    <TenantSwitcher />

                                    {/* Role badge */}
                                    {userRole && <RoleBadge role={userRole} />}

                                    {/* User display name (hidden on small screens) */}
                                    <span className="text-sm text-gray-300 hidden md:block max-w-[120px] truncate">
                                        {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User'}
                                    </span>

                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Page Content ─────────────────────────────────────────────── */}
            <main className="container-custom py-8">
                {children}
            </main>

            {/* ── Admin Mode Modal ─────────────────────────────────────────── */}
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

export default Layout;
