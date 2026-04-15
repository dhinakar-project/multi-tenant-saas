import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import { useNavigate } from 'react-router-dom';

function Settings() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { userRole } = useTenant();
    const navigate = useNavigate();
    
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDeleteAccount = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        try {
            setIsDeleting(true);
            await user.delete();
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Failed to delete account:', error);
            setIsDeleting(false);
            setConfirmDelete(false);
            alert("An error occurred while deleting your account. Please try again.");
        }
    };

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
                    Permanently delete your account and all associated personal data from this platform. This action cannot be undone, and you will immediately lose access to all your assigned tickets and organizations.
                </p>
                
                <div className="flex items-center relative z-10">
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className={`transition-all rounded-lg px-6 py-3 font-semibold text-sm shadow-lg flex items-center gap-2 ${
                            confirmDelete 
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/25 ring-2 ring-red-500 ring-offset-2 ring-offset-[#080B14]' 
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        }`}
                    >
                        {isDeleting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                            </span>
                        ) : confirmDelete ? (
                            'Yes, I am absolutely sure. Delete my account.'
                        ) : (
                            'Delete Account'
                        )}
                    </button>
                    
                    {confirmDelete && !isDeleting && (
                        <button 
                            onClick={() => setConfirmDelete(false)}
                            className="ml-4 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Settings;
