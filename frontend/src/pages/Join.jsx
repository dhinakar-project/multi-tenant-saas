import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const Join = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn } = useAuth();
    const token = searchParams.get('token');

    // UI state
    const [status, setStatus] = useState('Initializing invite link...');

    useEffect(() => {
        if (!isLoaded) return;

        if (!token) {
            navigate('/sign-in');
            return;
        }

        if (!isSignedIn) {
            // Save token to session storage so after login we can still use it
            sessionStorage.setItem('pending_invite_token', token);
            // Redirect to sign in/up
            navigate('/sign-in');
            return;
        }

        // If user is already signed in, save token and let TenantContext pick it up 
        // OR let them navigate to dashboard. We will actually process it in TenantContext during bootstrap.
        sessionStorage.setItem('pending_invite_token', token);
        setStatus('Invite token secured. Redirecting to workspace...');

        setTimeout(() => {
            navigate('/dashboard');
        }, 1500);

    }, [isLoaded, isSignedIn, token, navigate]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full border border-gray-700 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-white mb-2">Joining Organization</h2>
                <p className="text-gray-400">{status}</p>
            </div>
        </div>
    );
};

export default Join;
