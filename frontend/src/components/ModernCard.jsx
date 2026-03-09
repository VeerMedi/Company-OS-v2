import React from 'react';

const ModernCard = ({
    children,
    className = '',
    gradient = false,
    hover = true,
    glass = true,
    onClick
}) => {
    const baseClasses = glass ? 'glass-card' : 'bg-white';
    const hoverClasses = hover ? 'hover-lift' : '';
    const gradientBorder = gradient ? `before:absolute before:inset-0 before:rounded-2xl before:p-[2px] before:bg-gradient-to-r before:from-purple-500 before:to-pink-500 before:-z-10` : '';

    return (
        <div
            className={`${baseClasses} rounded-2xl p-6 transition-all duration-300 ${hoverClasses} ${gradientBorder} ${className} relative`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default ModernCard;
