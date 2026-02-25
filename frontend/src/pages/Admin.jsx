import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';

function Admin() {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);

    // Invite form state
    const [inviteRequest, setInviteRequest] = useState({ email: '', role: 'MEMBER' });
    const [generatedInviteLink, setGeneratedInviteLink] = useState(null);

    useEffect(() => {
        setClerkTokenGetter(getToken);
    }, [getToken]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'audit') fetchLogs();
    }, [activeTab]);

    const fetchUsers = async () => {
        try { const res = await api.get('/users'); setUsers(res.data); } catch (e) { }
    };
    const fetchLogs = async () => {
        try { const res = await api.get('/audit-logs'); setLogs(res.data); } catch (e) { }
    };

    const handleGenerateInvite = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/invites', inviteRequest);

            // Build absolute join URL for easy copying
            const joinUrl = `${window.location.origin}/join?token=${res.data.token}`;
            setGeneratedInviteLink(joinUrl);

            setInviteRequest({ email: '', role: 'MEMBER' });
            // Optionally, we could fetch invites here if we had a tab for them
        } catch (e) {
            alert('Failed to generate invite');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white">Admin Console</h1>

            {/* Tab Navigation */}
            <div className="flex space-x-2 border-b border-white/20">
                <button
                    className={`px-6 py-3 font-semibold transition-all ${activeTab === 'users'
                        ? 'border-b-2 border-indigo-500 text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button
                    className={`px-6 py-3 font-semibold transition-all ${activeTab === 'audit'
                        ? 'border-b-2 border-indigo-500 text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('audit')}
                >
                    Audit Logs
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Send Invite Form */}
                    <div className="glass-card-light p-6">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Invite User to Organization</h3>
                            <p className="text-sm text-gray-500 mt-1">Users must sign up via Clerk to join your tenant.</p>
                        </div>
                        <form onSubmit={handleGenerateInvite} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={inviteRequest.email}
                                    placeholder="colleague@company.com"
                                    onChange={e => setInviteRequest({ ...inviteRequest, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={inviteRequest.role}
                                    onChange={e => setInviteRequest({ ...inviteRequest, role: e.target.value })}
                                >
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="btn-primary w-full">
                                    Generate Invite
                                </button>
                            </div>
                        </form>

                        {/* Display generated invite link */}
                        {generatedInviteLink && (
                            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm font-semibold text-green-800 mb-2">Invite Generated Successfully!</p>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={generatedInviteLink}
                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedInviteLink);
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Users Table */}
                    <div className="glass-card-light overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{u.fullName}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                            {u.role || 'MEMBER'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {u.active ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="glass-card-light overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.actorEmail}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {log.summary}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Admin;
