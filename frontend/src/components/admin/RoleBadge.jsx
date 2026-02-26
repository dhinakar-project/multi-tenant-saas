import React from 'react';

/**
 * RoleBadge — Renders a styled pill badge for the user's role.
 * TENANT_ADMIN → amber/gold with subtle glow
 * MEMBER        → blue, soft tone
 */
function RoleBadge({ role, size = 'sm' }) {
    const isAdmin = role === 'TENANT_ADMIN';

    const sizeClasses = size === 'sm'
        ? 'px-2.5 py-0.5 text-xs'
        : 'px-3 py-1 text-sm';

    if (isAdmin) {
        return (
            <span
                className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClasses}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.22) 100%)',
                    color: '#fbbf24',
                    borderColor: 'rgba(251,191,36,0.45)',
                    boxShadow: '0 0 10px rgba(251,191,36,0.25)',
                }}
            >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                ADMIN
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClasses}`}
            style={{
                background: 'rgba(59,130,246,0.12)',
                color: '#60a5fa',
                borderColor: 'rgba(59,130,246,0.35)',
            }}
        >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            MEMBER
        </span>
    );
}

export default RoleBadge;
