import React from 'react';

/**
 * Top-level error boundary. Catches any uncaught React render errors and
 * shows a user-friendly crash screen instead of a blank white page.
 *
 * Wrap the entire app in main.jsx with this component.
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
                <div className="min-h-screen flex items-center justify-center bg-gray-950">
                    <div className="text-center p-8 max-w-md">
                        <div className="text-6xl mb-6">⚠️</div>
                        <h1 className="text-2xl font-semibold text-white mb-3">
                            Something went wrong
                        </h1>
                        <p className="text-gray-400 mb-2 text-sm leading-relaxed">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <p className="text-gray-600 text-xs mb-8">
                            If this keeps happening, please contact support.
                        </p>
                        <button
                            id="error-boundary-reload-btn"
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm
                                       hover:bg-indigo-700 transition-colors duration-200
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
