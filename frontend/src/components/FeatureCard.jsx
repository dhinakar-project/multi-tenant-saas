import React from 'react';

function FeatureCard({ icon, title, description }) {
    return (
        <div className="glass-card p-6">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

export default FeatureCard;
