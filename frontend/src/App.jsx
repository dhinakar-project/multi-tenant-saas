import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { TenantProvider } from './context/TenantContext';
import Dashboard from './pages/Dashboard';
import TicketCreate from './pages/TicketCreate';
import TicketDetail from './pages/TicketDetail';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import AuthHeader from './components/AuthHeader';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import Join from './pages/Join';

function App() {
    return (
        <TenantProvider>
            <Router>
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/sign-in/*" element={<SignInPage />} />
                    <Route path="/sign-up/*" element={<SignUpPage />} />

                    {/* Invite Processing */}
                    <Route path="/join" element={<Join />} />

                    {/* Public route */}
                    <Route path="/" element={
                        <>
                            <SignedIn>
                                <Navigate to="/dashboard" replace />
                            </SignedIn>
                            <SignedOut>
                                <Navigate to="/sign-in" replace />
                            </SignedOut>
                        </>
                    } />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                        <>
                            <SignedIn>
                                <AuthHeader />
                                <Layout><Dashboard /></Layout>
                            </SignedIn>
                            <SignedOut>
                                <Navigate to="/sign-in" replace />
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
                                <Navigate to="/sign-in" replace />
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
                                <Navigate to="/sign-in" replace />
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
                                <Navigate to="/sign-in" replace />
                            </SignedOut>
                        </>
                    } />
                </Routes>
            </Router>
        </TenantProvider>
    );
}

export default App;
