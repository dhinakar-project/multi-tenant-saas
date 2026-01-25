import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Dashboard from './pages/Dashboard';
import TicketCreate from './pages/TicketCreate';
import TicketDetail from './pages/TicketDetail';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import AuthHeader from './components/AuthHeader';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';

function App() {
    return (
        <Router>
            <Routes>
                {/* Auth Routes - These load immediately without waiting for Clerk */}
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />

                {/* Public route - redirect to dashboard if signed in, sign-in if signed out */}
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

                {/* Protected Routes - all require Clerk authentication */}
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
    );
}

export default App;
