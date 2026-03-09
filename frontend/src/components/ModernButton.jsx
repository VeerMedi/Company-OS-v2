import React from 'react';

const ModernButton = ({
    children,
    variant = 'gradient', // gradient, glass, outline, glow
    size = 'md', // sm, md, lg
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    onClick,
    className = '',
    type = 'button'
}) => {
    const sizeClasses = {
        sm: 'py-2 px-4 text-sm',
        md: 'py-3 px-6 text-base',
        lg: 'py-4 px-8 text-lg'
    };

    const variantClasses = {
        gradient: 'btn-gradient',
        glass: 'btn-glass',
        outline: 'border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold rounded-xl transition-all duration-300',
        glow: 'btn-glow'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
        flex items-center justify-center gap-2
        relative overflow-hidden
      `}
        >
            {loading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon className="h-5 w-5" />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon className="h-5 w-5" />}
                </>
            )}
        </button>
    );
};

export default ModernButton;
