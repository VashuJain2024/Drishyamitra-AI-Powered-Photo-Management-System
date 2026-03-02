import React from 'react';

const StatsCard = ({ label, value, icon }) => (
    <div className="glass-card stat-card animate-fade-in">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {icon && <div className="stat-icon">{icon}</div>}
    </div>
);

export default StatsCard;
