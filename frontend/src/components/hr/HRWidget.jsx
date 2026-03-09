import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Reusable Widget Component for HR Dashboards
const HRWidget = ({
    id,
    title,
    subtitle,
    icon: Icon,
    size,
    onSizeChange,
    children,
    color = 'blue'
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [initialSize, setInitialSize] = useState(size);

    useEffect(() => {
        setInitialSize(size);
    }, [size]);

    const getGridClass = () => {
        switch (size) {
            case 'small': return 'col-span-12 md:col-span-6 lg:col-span-3 row-span-1 h-[220px]';
            case 'medium': return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-1 h-[220px]';
            case 'large': return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-2 h-[464px]';
            default: return 'col-span-12 md:col-span-6 lg:col-span-3 row-span-1 h-[220px]';
        }
    };

    const handleDragStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStartY(e.clientY || e.touches?.[0]?.clientY || 0);
        setInitialSize(size);
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
        const deltaY = currentY - dragStartY;

        if (deltaY > 50 && initialSize === 'small') {
            onSizeChange(id, 'medium');
            setInitialSize('medium');
            setDragStartY(currentY);
        } else if (deltaY > 50 && initialSize === 'medium') {
            onSizeChange(id, 'large');
            setInitialSize('large');
            setDragStartY(currentY);
        } else if (deltaY < -50 && initialSize === 'large') {
            onSizeChange(id, 'medium');
            setInitialSize('medium');
            setDragStartY(currentY);
        } else if (deltaY < -50 && initialSize === 'medium') {
            onSizeChange(id, 'small');
            setInitialSize('small');
            setDragStartY(currentY);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('touchend', handleDragEnd);

            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
                window.removeEventListener('touchmove', handleDragMove);
                window.removeEventListener('touchend', handleDragEnd);
            };
        }
    }, [isDragging, dragStartY, initialSize]);

    return (
        <motion.div
            layout
            className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none focus:outline-none ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className={`absolute inset-0 bg-gradient-to-tr from-${color}-500/5 via-${color}-500/5 to-${color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

            <div className="relative p-6 h-full flex flex-col z-10">
                <div className="flex items-start justify-between mb-3 z-10 relative">
                    <div>
                        <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide flex items-center gap-2">
                            {Icon && <Icon size={14} className={`text-${color}-400`} />}
                            {title}
                        </h3>
                        {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex-1 min-h-0 relative flex flex-col z-0">
                    {children}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className={`absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-ns-resize z-20 opacity-0 hover:opacity-100 transition-all duration-200 ${isDragging ? 'opacity-100 scale-110' : ''}`}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                <div className="flex flex-col gap-[2px] items-end justify-center p-1">
                    <div className="flex gap-[2px]"><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? `bg-${color}-400` : 'bg-white/50'}`} /></div>
                    <div className="flex gap-[2px]"><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? `bg-${color}-400` : 'bg-white/50'}`} /><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? `bg-${color}-400` : 'bg-white/50'}`} /></div>
                    <div className="flex gap-[2px]"><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? `bg-${color}-400` : 'bg-white/50'}`} /><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? `bg-${color}-400` : 'bg-white/50'}`} /><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? `bg-${color}-400` : 'bg-white/50'}`} /></div>
                </div>
            </div>
        </motion.div>
    );
};

export default HRWidget;
