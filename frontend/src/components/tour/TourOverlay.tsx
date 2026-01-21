import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '../../context/TourContext';
import { Bot, X, ArrowRight } from 'lucide-react';

export const TourOverlay: React.FC = () => {
    const { isActive, currentStep, completeStep, endTour } = useTour();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const updateRect = useCallback(() => {
        if (currentStep?.targetId) {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }
    }, [currentStep]);

    useLayoutEffect(() => {
        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true); // Capture scroll

        // Also check periodically in case of layout changes
        const interval = setInterval(updateRect, 500);

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
            clearInterval(interval);
        };
    }, [updateRect]);

    if (!isActive || !currentStep) return null;

    // Background mask with a hole
    const maskStyle: React.CSSProperties = targetRect ? {
        clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${targetRect.left}px 100%, 
            ${targetRect.left}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.bottom}px, 
            ${targetRect.left}px ${targetRect.bottom}px, 
            ${targetRect.left}px 100%, 
            100% 100%, 
            100% 0%
        )`
    } : {};

    const getBubblePosition = () => {
        if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const padding = 20;
        const pos = currentStep.position || 'right';

        switch (pos) {
            case 'bottom':
                return {
                    top: targetRect.bottom + padding,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)'
                };
            case 'top':
                return {
                    bottom: window.innerHeight - targetRect.top + padding,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)'
                };
            case 'left':
                return {
                    top: targetRect.top + targetRect.height / 2,
                    right: window.innerWidth - targetRect.left + padding,
                    transform: 'translateY(-50%)'
                };
            case 'right':
            default:
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: Math.min(targetRect.right + padding, window.innerWidth - 320), // Ensure bubble doesn't go off-right
                    transform: 'translateY(-50%)'
                };
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        // If clicking outside the hole, do nothing or show a hint
        if (targetRect) {
            const { clientX, clientY } = e;
            const inHole = clientX >= targetRect.left && clientX <= targetRect.right &&
                clientY >= targetRect.top && clientY <= targetRect.bottom;

            if (!inHole) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Backdrop with hole */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 pointer-events-auto"
                style={maskStyle}
                onClick={handleBackdropClick}
            />

            {/* Scout & Speech Bubble */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute pointer-events-auto"
                    style={getBubblePosition()}
                >
                    <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[300px] max-w-[400px] relative">
                        {/* Scout Icon */}
                        <div className="absolute -top-12 left-6 w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white">
                            <Bot size={32} />
                        </div>

                        <div className="mt-4">
                            <h4 className="text-indigo-600 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                                Scout's Guide
                            </h4>
                            <p className="text-gray-800 leading-relaxed font-medium">
                                {currentStep.content}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={endTour}
                                className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors uppercase tracking-widest"
                            >
                                Skip Tour
                            </button>

                            {currentStep.actionType === 'view' && (
                                <button
                                    onClick={() => completeStep(currentStep.id)}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200"
                                >
                                    Got it <ArrowRight size={16} />
                                </button>
                            )}
                        </div>

                        {/* Speech Bubble Arrow */}
                        <div className={`absolute w-4 h-4 bg-white rotate-45 shadow-sm
                            ${currentStep.position === 'bottom' ? '-top-2 left-1/2 -ml-2' : ''}
                            ${currentStep.position === 'top' ? '-bottom-2 left-1/2 -ml-2' : ''}
                            ${currentStep.position === 'left' ? '-right-2 top-1/2 -mt-2' : ''}
                            ${currentStep.position === 'right' || !currentStep.position ? '-left-2 top-1/2 -mt-2' : ''}
                        `} />
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
