import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Premium Glass Card Wrapper */}
                {/* Premium Glass Card Wrapper */}
                <div className="glass-card p-8 rounded-[24px] border border-[rgba(255,255,255,0.12)] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[18px] hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-[2px] hover:bg-white/10">
                    {/* Brand Header */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <img
                            src="/logo.png"
                            alt="Multi-Tenant SaaS"
                            className="h-12 w-12 rounded-xl shadow-lg"
                        />
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-white drop-shadow-md">Multi-Tenant SaaS</h1>
                            <p className="text-white/70 text-sm">Sign in to your account</p>
                        </div>
                    </div>

                    {/* Clerk Sign In Component with Custom Styling */}
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-transparent shadow-none",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "bg-white/10 border border-white/20 hover:bg-white/15 text-white backdrop-blur-sm transition-all",
                                socialButtonsBlockButtonText: "text-white font-medium",
                                dividerLine: "bg-white/20",
                                dividerText: "text-gray-300",
                                formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all",
                                formFieldLabel: "text-gray-300 font-medium",
                                formFieldInput: "bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60 backdrop-blur-sm transition-all",
                                footerActionLink: "text-indigo-400 hover:text-indigo-300 transition-colors",
                                identityPreviewText: "text-white",
                                formFieldInputShowPasswordButton: "text-gray-300 hover:text-white",
                                otpCodeFieldInput: "bg-white/10 border-white/20 text-white",
                                formResendCodeLink: "text-indigo-400 hover:text-indigo-300",
                                footer: "hidden"
                            }
                        }}
                        routing="path"
                        path="/sign-in"
                        signUpUrl="/sign-up"
                        afterSignInUrl="/dashboard"
                    />

                    {/* Custom Footer */}
                    <div className="mt-6 text-center border-t border-white/10 pt-6">
                        <p className="text-sm text-gray-300">
                            Don't have an account?{' '}
                            <Link to="/sign-up" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignInPage;
