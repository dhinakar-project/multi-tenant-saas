import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';

function Admin() {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);

    // User form state
    const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', role: 'TICKET_READ' });

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

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            setNewUser({ email: '', password: '', fullName: '', role: 'TICKET_READ' });
            fetchUsers();
        } catch (e) {
            alert('Failed to create user');
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
                    {/* Create User Form */}
                    <div className="glass-card-light p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={newUser.fullName}
                                    onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="btn-primary w-full">
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Users Table */}
                    <div className="glass-card-light overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{u.fullName}</td>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            {activeTab === 'users' && u.roles ? u.roles.join(', ') : ''}
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
