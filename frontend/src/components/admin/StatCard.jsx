import React, { useEffect, useState } from 'react';

/**
 * StatCard — Animated KPI card for the Admin Overview dashboard.
 * Props: icon (emoji or SVG), label, value, accent (CSS color string)
 */
function StatCard({ icon, label, value, accent = '#6366f1' }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Stagger mount animation via short delay
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className="stat-card"
            style={{
                background: 'rgba(15,23,42,0.7)',
                border: `1px solid ${accent}33`,
                borderRadius: '14px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'default',
                transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 320ms ease, translate 320ms ease',
                opacity: visible ? 1 : 0,
                translate: visible ? '0 0' : '0 16px',
                boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = `0 12px 36px rgba(0,0,0,0.55), 0 0 20px ${accent}33`;
                e.currentTarget.style.borderColor = `${accent}66`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
                e.currentTarget.style.borderColor = `${accent}33`;
            }}
        >
            {/* Icon bubble */}
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${accent}22`,
                    border: `1px solid ${accent}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div>
                <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
                    {label}
                </p>
                <p style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, margin: '2px 0 0', lineHeight: 1 }}>
                    {value ?? '—'}
                </p>
            </div>
        </div>
    );
}

export default StatCard;
