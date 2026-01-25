import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';

function Layout({ children }) {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    // Get tenant slug from localStorage (temporary until Clerk orgs integration)
    const tenantSlug = localStorage.getItem('tenantSlug') || 'demo';

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen">
            <nav className="sticky top-0 z-50 glass-card border-b border-white/10">
                <div className="container-custom">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-sm">ST</span>
                                </div>
                                <span className="font-bold text-white text-lg drop-shadow-lg">SaaS Tickets</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {isSignedIn && (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')
                                                ? 'bg-white/20 text-white'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/admin"
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin')
                                                ? 'bg-white/20 text-white'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            Admin
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {isSignedIn && (
                                <>
                                    <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-gray-300 border border-white/20">
                                        {tenantSlug}
                                    </div>
                                    <span className="text-sm text-gray-300 hidden md:block">
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

            <main className="container-custom py-8">
                {children}
            </main>
        </div>
    );
}

export default Layout;

