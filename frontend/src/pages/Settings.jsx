import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

function Settings() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { userRole } = useTenant();
    const navigate = useNavigate();

    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmStep, setConfirmStep] = useState(0); // 0=idle, 1=first confirm, 2=typed confirm
    const [confirmText, setConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState(null);

    const CONFIRM_PHRASE = 'DELETE';

    const handleDeleteClick = () => {
        if (confirmStep === 0) { setConfirmStep(1); return; }
        if (confirmStep === 1) { setConfirmStep(2); return; }
    };

    const handleDeleteConfirmed = async () => {
        if (confirmText !== CONFIRM_PHRASE) return;

        try {
            setIsDeleting(true);
            setDeleteError(null);

            // Step 1: Remove user from our DB (user_tenants + users table)
            await api.delete('/users/me');

            // Step 2: Try to delete from Clerk (requires "Allow users to delete their account"
            // to be enabled in Clerk Dashboard → User & Authentication → Email, Phone, Username)
            try { await user.delete(); } catch (_) { /* Clerk deletion optional */ }

            // Step 3: Sign out & redirect
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Failed to delete account:', error);
            setDeleteError(error.response?.data?.message || error.message || 'Deletion failed. Please try again.');
            setIsDeleting(false);
            setConfirmStep(0);
            setConfirmText('');
        }
    };

    const handleCancel = () => { setConfirmStep(0); setConfirmText(''); setDeleteError(null); };


    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                    Account Settings
                </h1>
                <p className="text-slate-400">Manage your profile and platform preferences.</p>
            </div>

            {/* Profile Overview Card */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden ring-1 ring-white/5">
                <div className="absolute top-0 right-0 p-32 bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />
                
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="text-indigo-400">●</span> Profile Info
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                        <div className="text-white bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-medium">
                            {user.fullName || 'Not Provided'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="text-white bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-medium">
                            {user.primaryEmailAddress?.emailAddress || 'Not Provided'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tenant Role</label>
                        <div className="inline-flex items-center px-4 py-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-sm">
                            {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Member'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Created</label>
                        <div className="text-slate-300 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-medium">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="p-8 rounded-2xl relative overflow-hidden border border-red-500/20 bg-red-500/5 mt-12">
                <div className="absolute top-0 left-0 p-32 bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />

                <h2 className="text-xl font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <span className="text-red-500">⚠</span> Danger Zone
                </h2>
                <p className="text-red-200/60 mb-6 text-sm max-w-2xl">
                    Permanently delete your account and all associated data. This removes you from all organizations and cannot be undone.
                </p>

                {deleteError && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
                        {deleteError}
                    </div>
                )}

                <div className="relative z-10 space-y-4">
                    {/* Step 0: Initial button */}
                    {confirmStep === 0 && (
                        <button
                            onClick={handleDeleteClick}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all rounded-lg px-6 py-3 font-semibold text-sm"
                        >
                            Delete Account
                        </button>
                    )}

                    {/* Step 1: First warning */}
                    {confirmStep === 1 && (
                        <div className="space-y-3">
                            <p className="text-red-300 text-sm font-medium">
                                This will permanently remove your account from our database. Are you sure?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteClick}
                                    className="bg-red-600/80 hover:bg-red-600 text-white rounded-lg px-5 py-2.5 font-semibold text-sm transition-all"
                                >
                                    Yes, continue
                                </button>
                                <button onClick={handleCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Type DELETE to confirm */}
                    {confirmStep === 2 && (
                        <div className="space-y-3 max-w-sm">
                            <p className="text-red-300 text-sm">
                                Type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">DELETE</span> to confirm:
                            </p>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                disabled={isDeleting}
                                className="w-full bg-white/5 border border-red-500/30 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteConfirmed}
                                    disabled={confirmText !== CONFIRM_PHRASE || isDeleting}
                                    className="disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500 text-white rounded-lg px-5 py-2.5 font-semibold text-sm transition-all flex items-center gap-2 ring-2 ring-red-500 ring-offset-2 ring-offset-[#080B14]"
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Deleting…
                                        </>
                                    ) : 'Permanently Delete Account'}
                                </button>
                                <button onClick={handleCancel} disabled={isDeleting} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Settings;

