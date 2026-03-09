import React from 'react';
import { motion } from 'framer-motion';
import { FileText, MoreHorizontal } from 'lucide-react';

/**
 * Apple-style Card Icon Component - Folder Edition
 * Matches the specific "Work files" folder look with a darker front panel and tab shape.
 * 
 * @param {string} type - 'notes' | 'handbook' | 'meetings' | 'scrum'
 */
const AppleCardIcon = ({
    title = "Notes",
    subtitle = "Notes & More",
    count = 0,
    icon: Icon = FileText,
    onClick,
    gradientFrom = "from-blue-400",
    gradientTo = "to-blue-600",
    className = "",
    type = 'notes'
}) => {

    // Render the specific illustration based on type
    const renderIllustration = () => {
        if (type === 'handbook') {
            return (
                <div className="absolute top-[20%] right-[12%] transform scale-[0.65] origin-top-right z-0">
                    {/* Book Cover (Back) */}
                    <div className="absolute -left-4 -top-2 w-20 h-24 bg-blue-900 rounded-r-lg shadow-lg transform -rotate-6 border-l-4 border-l-blue-950 border-r border-t border-b border-white/20"></div>

                    {/* Pages Block */}
                    <div className="absolute -left-4 -top-2 w-[76px] h-[92px] bg-white rounded-r-md shadow-md transform -rotate-6 translate-x-1 translate-y-1">
                        {/* Page lines */}
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-gray-200 to-white rounded-r-md border-r border-gray-300"></div>
                    </div>

                    {/* Book Cover (Front) */}
                    <div className="relative w-20 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-r-lg rounded-l-sm shadow-2xl transform -rotate-6 border-l-2 border-l-blue-300/50 border-t border-r border-b border-white/30 flex items-center justify-center">
                        <div className="absolute bottom-4 right-3 w-4 h-4 rounded-full border border-white/40"></div>
                    </div>
                </div>
            );
        }

        if (type === 'meetings') {
            return (
                <div className="absolute top-[22%] right-[15%] transform scale-[0.7] origin-top-right z-0">
                    {/* Calendar Card */}
                    <div className="relative w-20 h-24 bg-white rounded-lg shadow-2xl border border-white/70 overflow-hidden">
                        {/* Calendar Header (Red) */}
                        <div className="h-6 bg-red-500 relative">
                            {/* Binding holes */}
                            <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-red-700 rounded-full"></div>
                            <div className="absolute top-2 right-3 w-1.5 h-1.5 bg-red-700 rounded-full"></div>
                        </div>

                        {/* Calendar Body */}
                        <div className="p-2 bg-white">
                            {/* Date Number */}
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-800">15</div>
                                <div className="text-[6px] text-gray-500 uppercase tracking-wide">Tuesday</div>
                            </div>

                            {/* Event dots */}
                            <div className="flex justify-center gap-1 mt-2">
                                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'scrum') {
            return (
                <div className="absolute top-[22%] right-[15%] transform scale-[0.7] origin-top-right z-0">
                    {/* Team Icon - Three avatars */}
                    <div className="relative w-20 h-24 flex items-center justify-center">
                        {/* Back avatar */}
                        <div className="absolute left-1 top-4 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-white/30 rounded-full"></div>
                        </div>

                        {/* Middle avatar */}
                        <div className="absolute right-1 top-4 w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-white/30 rounded-full"></div>
                        </div>

                        {/* Front avatar */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center z-10">
                            <div className="w-5 h-5 bg-white/30 rounded-full"></div>
                        </div>
                    </div>
                </div>
            );
        }

        // Default Notes Illustration (Documents)
        return (
            <div className="absolute top-[22%] right-[15%] transform scale-[0.65] origin-top-right z-0">
                {/* Back document */}
                <div className="absolute -left-8 -top-1 w-20 h-24 bg-white/80 rounded-lg shadow-md transform -rotate-12 border border-white/50" />

                {/* Middle document */}
                <div className="absolute -left-4 top-1 w-20 h-24 bg-white/90 rounded-lg shadow-md transform -rotate-6 border border-white/60" />

                {/* Front document */}
                <div className="relative w-20 h-24 bg-white rounded-lg shadow-xl border border-white/70 overflow-hidden">
                    <div className="p-3 space-y-2 opacity-50">
                        <div className="w-12 h-1 bg-gray-400 rounded-full" />
                        <div className="w-full h-1 bg-gray-300 rounded-full" />
                        <div className="w-5/6 h-1 bg-gray-300 rounded-full" />
                        <div className="w-full h-1 bg-gray-200 rounded-full" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{
                y: -4,
                boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)"
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-black shadow-2xl group cursor-pointer ${className}`}
        >
            {/* 1. Background Layer: Gradient Sky */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} z-0`}>
                {/* Top Shine */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>

            {/* 2. Middle Layer: Floating Illustration (Peeking from behind folder) */}
            {renderIllustration()}

            {/* 3. Front Layer: The "Folder" Shape Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end">
                {/* SVG Shape for the Dark Folder Front */}
                <div className="relative w-full h-[65%]">
                    {/* The Dark Shape */}
                    <div className="absolute inset-0 drop-shadow-2xl">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                            <defs>
                                <linearGradient id="folderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#1f2937" /> {/* Gray-800 */}
                                    <stop offset="100%" stopColor="#111827" /> {/* Gray-900 */}
                                </linearGradient>
                            </defs>
                            {/* Path: Start Left-Top(Tab), Curve Down-Right, Go Bottom, Close */}
                            <path
                                d="M0,28 L42,28 C52,28 58,45 68,45 L100,45 L100,100 L0,100 Z"
                                fill="#1c1c1e"
                            />
                        </svg>
                    </div>

                    {/* Content Inside the Folder Front */}
                    <div className="absolute inset-0 px-3 pb-3 flex flex-col justify-between">

                        {/* Header Row: Title on Left, Dots on Right */}
                        {/* Pushed top margin down to mt-[30%] for better alignment */}
                        <div className="flex items-start justify-between mt-[30%]">
                            {/* Title & Subtitle */}
                            <div className="text-left z-20">
                                <h3 className="text-white font-semibold text-[14px] leading-tight tracking-wide">
                                    {title}
                                </h3 >
                                <p className="text-gray-400 text-[10px] font-medium mt-0.5 ml-0.5">
                                    {subtitle}
                                </p>
                            </div>

                            {/* Three Dots (Menu) */}
                            <div className="mt-5 opacity-50">
                                <MoreHorizontal size={14} className="text-gray-400" />
                            </div>
                        </div>

                        {/* Footer Row: File Count */}
                        <div className="flex items-center gap-1.5 text-gray-400 pl-0.5">
                            {count > 0 ? (
                                <>
                                    <Icon size={12} className="opacity-70" />
                                    <span className="text-[10px] font-medium tracking-wide">
                                        {count.toLocaleString()} Items
                                    </span>
                                </>
                            ) : (
                                /* Spacer to keep layout specific */
                                <div className="h-4"></div>
                            )}
                        </div>
                    </div>

                    {/* Top Edge Highlight for 3D effect */}
                    <div className="absolute top-[28%] left-0 w-[42%] h-px bg-white/20 pointer-events-none" />
                </div>
            </div>

            {/* Overall Rim Light / Border - PITCH BLACK */}
            <div className="absolute inset-0 rounded-2xl border-[3px] border-black pointer-events-none z-50"></div>

        </motion.button>
    );
};

export default AppleCardIcon;
