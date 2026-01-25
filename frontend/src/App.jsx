import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useClerk } from '@clerk/clerk-react';
import Dashboard from './pages/Dashboard';
import TicketCreate from './pages/TicketCreate';
import TicketDetail from './pages/TicketDetail';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import AuthHeader from './components/AuthHeader';

function App() {
    const { loaded } = useClerk();

    // Show loading state until Clerk is fully loaded
    if (!loaded) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#ffffff',
                fontSize: '1.2rem',
                color: '#666',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* Public route - redirect to dashboard if signed in */}
                <Route path="/" element={
                    <>
                        <SignedIn>
                            <Navigate to="/dashboard" replace />
                        </SignedIn>
                        <SignedOut>
                            <RedirectToSignIn />
                        </SignedOut>
                    </>
                } />

                {/* Protected Routes - all require Clerk authentication */}
                <Route path="/dashboard" element={
                    <>
                        <SignedIn>
                            <AuthHeader />
                            <Layout><Dashboard /></Layout>
                        </SignedIn>
                        <SignedOut>
                            <RedirectToSignIn />
                        </SignedOut>
                    </>
                } />

                <Route path="/tickets/new" element={
                    <>
                        <SignedIn>
                            <AuthHeader />
                            <Layout><TicketCreate /></Layout>
                        </SignedIn>
                        <SignedOut>
                            <RedirectToSignIn />
                        </SignedOut>
                    </>
                } />

                <Route path="/tickets/:id" element={
                    <>
                        <SignedIn>
                            <AuthHeader />
                            <Layout><TicketDetail /></Layout>
                        </SignedIn>
                        <SignedOut>
                            <RedirectToSignIn />
                        </SignedOut>
                    </>
                } />

                <Route path="/admin" element={
                    <>
                        <SignedIn>
                            <AuthHeader />
                            <Layout><Admin /></Layout>
                        </SignedIn>
                        <SignedOut>
                            <RedirectToSignIn />
                        </SignedOut>
                    </>
                } />
            </Routes>
        </Router>
    );
}

export default App;
