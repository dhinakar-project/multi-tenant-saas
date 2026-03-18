import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import api, { setClerkTokenGetter } from '../api/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ErrorCard from '../components/ErrorCard';
import FeatureCard from '../components/FeatureCard';
import FAQAccordion from '../components/FAQAccordion';

function Dashboard() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { tenantSlug, tenantName, userRole, isAdmin, isBootstrapping, bootstrapError } = useTenant();
    const location = useLocation();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            // Handle paginated response - backend returns Page object with 'content' array
            setTickets(res.data.content || res.data || []);
        } catch (e) {
            console.error('Failed to fetch tickets:', e);
            setError(e.response?.data?.message || e.message || 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    // Loading state - Clerk session loading
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white">Loading session...</p>
                </div>
            </div>
        );
    }

    // Not signed in (should not happen due to route guard, but safety check)
    if (!isSignedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="glass-card-light p-6">
                    <p className="text-yellow-800">Not signed in. Please sign in to continue.</p>
                </div>
            </div>
        );
    }

    // Tenant bootstrapping in progress
    if (isBootstrapping) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white">Setting up your workspace...</p>
                </div>
            </div>
        );
    }

    // Bootstrap error
    if (bootstrapError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="glass-card-light p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-red-800 mb-4">Setup Error</h2>
                    <p className="text-gray-600 mb-6">{bootstrapError}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full">Retry</button>
                </div>
            </div>
        );
    }

    // No tenant (shouldn't happen with auto-bootstrap, but safety check)
    if (!tenantSlug) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white">Initializing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative py-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                            Multi-Tenant Issue & Ticket Management
                        </h1>
                        <p className="text-xl text-gray-300/90 mb-6 leading-relaxed">
                            Powerful, secure, and scalable ticket management for modern teams.
                            Complete tenant isolation with enterprise-grade security.
                        </p>
                    </div>

                    <div className="glass-card p-8 border-2">
                        <div className="mb-8">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Tenant</h3>
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-lg">{tenantSlug.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">{tenantSlug}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="flex items-center space-x-1.5">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-xs text-green-400 font-medium">Signed In</span>
                                        </div>
                                        {/* Role badge — Layer 1 UI visibility */}
                                        {userRole && (
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isAdmin
                                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                }`}>
                                                {isAdmin ? 'Admin' : 'Member'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                            <button
                                onClick={() => navigate('/tickets/new')}
                                className="btn-primary w-full"
                            >
                                Create Ticket
                            </button>
                            <button
                                onClick={() => document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="btn-secondary w-full"
                            >
                                View Tickets
                            </button>
                            {/* Admin Console — Layer 1: Hidden from MEMBER users entirely */}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="btn-secondary w-full"
                                >
                                    Admin Console
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* What You Can Do Section */}
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 text-center">What You Can Do</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon="🎫"
                        title="Manage Tickets"
                        description="Create, track, and resolve tickets with customizable priorities and statuses. Keep your team organized and productive."
                    />
                    <FeatureCard
                        icon="💬"
                        title="Collaborate"
                        description="Add comments, discuss solutions, and keep everyone in the loop. Real-time updates for seamless teamwork."
                    />
                    <FeatureCard
                        icon="🔐"
                        title="Secure Access"
                        description="Role-based permissions ensure team members only see what they need. Complete tenant data isolation."
                    />
                    <FeatureCard
                        icon="🏢"
                        title="Multi-Tenant"
                        description="Each organization gets its own isolated workspace. Your data stays private and secure."
                    />
                </div>
            </section>

            {/* How It Works Section */}
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
                <div className="glass-card p-8">
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Create Your Tenant</h3>
                                <p className="text-gray-300">Sign up and get your own isolated workspace with a unique tenant slug.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Invite Your Team</h3>
                                <p className="text-gray-300">Use the Admin Console to invite team members. They'll get secure access to your tenant.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Create & Track Tickets</h3>
                                <p className="text-gray-300">Start creating tickets, assign priorities, and track progress in real-time.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                4
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Collaborate & Resolve</h3>
                                <p className="text-gray-300">Add comments, update statuses, and resolve issues efficiently with your team.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security & Multi-tenancy Section */}
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Security & Multi-Tenancy</h2>
                <div className="glass-card p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">🔒 Enterprise Security</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>✓ JWT-based authentication with Clerk</li>
                                <li>✓ Encrypted data in transit and at rest</li>
                                <li>✓ Row-level security in database</li>
                                <li>✓ API request validation</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">🏢 Tenant Isolation</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>✓ X-Tenant-Slug header for identification</li>
                                <li>✓ Complete data separation per tenant</li>
                                <li>✓ Independent user management</li>
                                <li>✓ Scalable multi-tenant architecture</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
                <FAQAccordion />
            </section>

            {/* Tickets Section */}
            <section id="tickets-section">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-white">Your Tickets</h2>
                    <Link to="/tickets/new" className="btn-primary">
                        Create Ticket
                    </Link>
                </div>

                {/* Error State */}
                {error && (
                    <ErrorCard
                        title="We couldn't load tickets"
                        message={error}
                        onRetry={fetchTickets}
                    />
                )}

                {/* Loading State */}
                {loading && !error && (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Tickets Table */}
                {!loading && !error && (
                    <div className="glass-card-light overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-lg font-medium">No tickets yet</p>
                                                <p className="text-sm text-gray-400 mt-1">Create your first ticket to get started!</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span>{ticket.title}</span>
                                                    {ticket.aiCategory && (
                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                                            {ticket.aiCategory}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                                    ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                                        ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to={`/tickets/${ticket.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                                                    View →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Dashboard;
