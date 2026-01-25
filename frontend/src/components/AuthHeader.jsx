import React from "react";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";

const AuthHeader = () => {
    return (
        <header style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", textShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>Multi-Tenant SaaS</h1>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <SignedOut>
                        <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
                            <button style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                            <button style={{ padding: "0.5rem 1rem", cursor: "pointer", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px" }}>
                                Sign Up
                            </button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
};

export default AuthHeader;
