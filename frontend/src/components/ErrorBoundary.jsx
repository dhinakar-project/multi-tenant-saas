import React from 'react';

/**
 * Top-level error boundary. Catches any uncaught React render errors and
 * shows a polished, user-friendly crash screen instead of a blank white page.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // In production this would go to a monitoring service (Sentry, etc.)
        console.error('Uncaught error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#05060f', fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                    <div className="glass-card" style={{
                        padding: '48px', maxWidth: 480, width: '90%', textAlign: 'center',
                        border: '1px solid rgba(239,68,68,0.2)',
                        boxShadow: '0 0 40px rgba(239,68,68,0.05)',
                    }}>
                        {/* Animated lightning bolt icon */}
                        <div style={{
                            width: 64, height: 64, borderRadius: 16,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px', fontSize: 32,
                            animation: 'pulse-ring 2s ease infinite',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                        </div>

                        <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                            Something went wrong
                        </h1>

                        <div style={{
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: 10, padding: '12px 16px', marginBottom: 24
                        }}>
                            <p style={{ color: '#f87171', fontSize: 13, margin: 0, fontFamily: 'monospace', wordBreak: 'break-word', lineHeight: 1.6 }}>
                                {this.state.error?.message || 'An unexpected error occurred.'}
                            </p>
                        </div>

                        <p style={{ color: '#475569', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
                            If this keeps happening,{' '}
                            <a href="mailto:support@example.com" style={{ color: '#a78bfa', textDecoration: 'underline' }}>
                                contact support
                            </a>
                        </p>

                        <button
                            id="error-boundary-reload-btn"
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-secondary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
