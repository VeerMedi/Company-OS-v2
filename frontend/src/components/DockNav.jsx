import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import DockPreview from './DockPreview';

/**
 * macOS-style Dock Navigation Component
 * 
 * Features:
 * - Cursor-distance-based magnification (NOT hover-based)
 * - Fixed container size - only icons zoom
 * - Labels appear below hovered icon
 * - Transparent glassmorphism frame
 */

// Physics constants
const DOCK_CONFIG = {
    baseIconSize: 20,
    maxIconSize: 64,
    magnificationRange: 180,
    springConfig: { damping: 12, stiffness: 200, mass: 0.15 },
    verticalLiftMultiplier: 0.8,
};

// Gaussian falloff for smooth scaling
const gaussianFalloff = (distance, range) => {
    const sigma = range / 2.5;
    return Math.exp(-(distance * distance) / (2 * sigma * sigma));
};

// Individual Dock Item
const DockItem = ({
    item,
    mouseX,
    baseSize,
    maxSize,
    magnificationRange,
    springConfig,
    verticalLift,
    index,
    reducedMotion,
    onKeyboardNav,
    onHoverChange,
    onItemClick,
}) => {
    const ref = useRef(null);
    const distanceFromMouse = useMotionValue(Infinity);
    const scaleSpring = useSpring(1, springConfig);
    const [isHovered, setIsHovered] = useState(false);

    // Simple hover handlers - show when mouse enters, hide when leaves
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        if (ref.current) {
            const buttonRect = ref.current.getBoundingClientRect();
            const iconCenterX = buttonRect.left + buttonRect.width / 2;
            // Calculate distance from bottom of screen to top of icon, plus spacing
            const distanceFromBottom = window.innerHeight - buttonRect.top + 20; // +20 for spacing between preview and icon

            console.log('[Preview Position]', item.label, {
                iconCenterX,
                distanceFromBottom,
                buttonRect: { left: buttonRect.left, top: buttonRect.top, width: buttonRect.width }
            });

            onHoverChange?.(item, { x: iconCenterX, y: distanceFromBottom });
        }
    }, [item, onHoverChange]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        onHoverChange?.(null, null);
    }, [onHoverChange]);

    // Track mouse distance for scaling only
    useEffect(() => {
        if (reducedMotion) return;

        const updateDistance = () => {
            if (!ref.current) return;

            const rect = ref.current.getBoundingClientRect();
            const iconCenterX = rect.left + rect.width / 2;
            const currentMouseX = mouseX.get();

            if (currentMouseX === null || currentMouseX === undefined) {
                distanceFromMouse.set(Infinity);
                return;
            }

            const distance = Math.abs(iconCenterX - currentMouseX);
            distanceFromMouse.set(distance);
        };

        const unsubscribe = mouseX.on('change', updateDistance);
        return () => unsubscribe();
    }, [mouseX, distanceFromMouse, reducedMotion]);

    // Update scale based on distance
    useEffect(() => {
        if (reducedMotion) {
            scaleSpring.set(1);
            return;
        }

        const updateScale = () => {
            const distance = distanceFromMouse.get();

            if (distance === Infinity || distance > magnificationRange * 1.5) {
                scaleSpring.set(1);
                return;
            }

            const falloff = gaussianFalloff(distance, magnificationRange);
            const scaleFactor = 1 + (maxSize / baseSize - 1) * falloff;
            scaleSpring.set(scaleFactor);
        };

        const unsubscribe = distanceFromMouse.on('change', updateScale);
        return () => unsubscribe();
    }, [distanceFromMouse, scaleSpring, baseSize, maxSize, magnificationRange, reducedMotion]);

    // Transform scale to vertical translation
    const translateY = useTransform(scaleSpring, (scale) => {
        const scaleIncrease = scale - 1;
        const lift = scaleIncrease * baseSize * verticalLift;
        return -lift;
    });

    // Calculate dynamic width for wrapper - expands when icon zooms
    const wrapperWidth = useTransform(scaleSpring, (scale) => scale * baseSize);

    const IconComponent = item.icon;
    const isActive = item.active;

    return (
        <motion.div
            className="dock-item-wrapper relative flex flex-col items-center justify-end"
            style={{
                width: wrapperWidth,   // Dynamic width
                height: baseSize,      // Fixed height
            }}
        >
            {/* Icon container - this one scales */}
            <motion.button
                ref={ref}
                onClick={() => onItemClick?.(item)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') onKeyboardNav(index + 1);
                    if (e.key === 'ArrowLeft') onKeyboardNav(index - 1);
                    if (e.key === 'Enter' || e.key === ' ') onItemClick?.(item);
                }}
                className="dock-item absolute bottom-0 left-1/2 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm"
                style={{
                    width: useTransform(scaleSpring, (s) => s * baseSize),
                    height: useTransform(scaleSpring, (s) => s * baseSize),
                    x: '-50%',
                    y: translateY,
                }}
                whileTap={{ scale: 0.92 }}
                aria-label={item.label}
                tabIndex={0}
            >
                <motion.div
                    className={`
            w-full h-full flex items-center justify-center rounded-sm
            transition-colors duration-200
            ${isActive
                            ? 'bg-white/25 shadow-lg shadow-white/10'
                            : 'bg-white/10 hover:bg-white/20'
                        }
          `}
                    style={{ backdropFilter: 'blur(8px)' }}
                >
                    <IconComponent
                        className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-300'}`}
                        style={{ width: '55%', height: '55%' }}
                    />
                </motion.div>

            </motion.button>

            {/* Label below icon - only shows when hovered */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    >
                        <span className="text-[10px] font-medium text-white/90 bg-gray-900/80 px-2 py-0.5 rounded-none backdrop-blur-sm">
                            {item.label}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Main Dock Component
const DockNav = ({ items = [], position = 'bottom' }) => {
    const dockRef = useRef(null);
    const mouseX = useMotionValue(null);
    const [isHovering, setIsHovering] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [previewPosition, setPreviewPosition] = useState(null);
    const [isExpanding, setIsExpanding] = useState(false);
    const [expandingItem, setExpandingItem] = useState(null);

    const reducedMotion = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (reducedMotion) return;
        mouseX.set(e.clientX);
    }, [mouseX, reducedMotion]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(null);
        setIsHovering(false);
        setHoveredItem(null);
        setPreviewPosition(null);
    }, [mouseX]);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
    }, []);

    const handleKeyboardNav = useCallback((newIndex) => {
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        const buttons = dockRef.current?.querySelectorAll('button');
        buttons?.[newIndex]?.focus();
    }, [items.length]);

    // Handle click with expansion animation
    const handleItemClick = useCallback((item) => {
        if (!item?.onClick) return;

        // Store the item being expanded
        setExpandingItem(item);
        setIsExpanding(true);

        // After animation completes, trigger the actual view change
        setTimeout(() => {
            item.onClick();
            setIsExpanding(false);
            setExpandingItem(null);
            setHoveredItem(null);
            setPreviewPosition(null);
        }, 450); // Trigger before animation ends for smooth overlap
    }, []);

    // Global mouse tracking with tight detection range
    useEffect(() => {
        if (reducedMotion) return;

        const handleGlobalMouseMove = (e) => {
            if (!dockRef.current) return;

            const rect = dockRef.current.getBoundingClientRect();
            const verticalRange = 40;
            const horizontalRange = 20;

            const isInRange =
                e.clientX >= rect.left - horizontalRange &&
                e.clientX <= rect.right + horizontalRange &&
                e.clientY >= rect.top - verticalRange &&
                e.clientY <= rect.bottom + 10;

            if (isInRange) {
                mouseX.set(e.clientX);
                if (!isHovering) setIsHovering(true);
            } else {
                // Clear hover state if mouse moves far away (200px)
                const distanceX = Math.min(
                    Math.abs(e.clientX - rect.left),
                    Math.abs(e.clientX - rect.right)
                );
                const distanceY = Math.min(
                    Math.abs(e.clientY - rect.top),
                    Math.abs(e.clientY - rect.bottom)
                );
                const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                if (totalDistance > 250 || !isInRange) {
                    mouseX.set(null);
                    setIsHovering(false);
                    setHoveredItem(null);
                    setPreviewPosition(null);
                }
            }
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, [mouseX, isHovering, reducedMotion]);

    if (!items || items.length === 0) return null;

    return (
        <motion.nav
            ref={dockRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
            className={`
        fixed z-50 flex items-end justify-center
        ${position === 'bottom' ? 'bottom-4 inset-x-0 mx-auto w-fit' : 'left-4 top-1/2 transform -translate-y-1/2 flex-col'}
      `}
            role="navigation"
            aria-label="Main navigation dock"
        >
            {/* Fixed height, dynamic width container */}
            <div
                className="dock-container relative flex items-end justify-center gap-1.5 px-2 py-1 rounded-md"
                style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid rgba(${hoveredItem?.themeColor || '59, 130, 246'}, 0.5)`,
                    boxShadow: `
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        0 0 20px rgba(${hoveredItem?.themeColor || '59, 130, 246'}, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05)
                    `,
                    transition: 'border 0.3s ease, box-shadow 0.3s ease',
                }}
            >
                {items.map((item, index) => (
                    <DockItem
                        key={`dock-item-${index}-${item.label}`}
                        item={item}
                        index={index}
                        mouseX={mouseX}
                        baseSize={DOCK_CONFIG.baseIconSize}
                        maxSize={DOCK_CONFIG.maxIconSize}
                        magnificationRange={DOCK_CONFIG.magnificationRange}
                        springConfig={DOCK_CONFIG.springConfig}
                        verticalLift={DOCK_CONFIG.verticalLiftMultiplier}
                        reducedMotion={reducedMotion}
                        onKeyboardNav={handleKeyboardNav}
                        onHoverChange={(item, pos) => {
                            setHoveredItem(item);
                            setPreviewPosition(pos);
                        }}
                        onItemClick={handleItemClick}
                    />
                ))}
            </div>

            {/* Preview Card */}
            <DockPreview
                isVisible={!!hoveredItem || isExpanding}
                viewId={expandingItem?.viewId || hoveredItem?.viewId}
                position={previewPosition}
                previewData={expandingItem?.previewData || hoveredItem?.previewData}
                reducedMotion={reducedMotion}
                isExpanding={isExpanding}
            />
        </motion.nav>
    );
};

export default DockNav;
