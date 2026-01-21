import React, { useState, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '../../context/TourContext';
import { Bot, ArrowRight } from 'lucide-react';

export const TourOverlay: React.FC = () => {
    const {
        isActive,
        isDismissed,
        currentStep,
        completeStep,
        endTour,
        dismissStep,
        scoutMessage,
        scoutMood,
        isGenerating,
        setIsDismissed
    } = useTour();
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
        window.addEventListener('scroll', updateRect, true);

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
                    left: Math.min(targetRect.right + padding, window.innerWidth - 320),
                    transform: 'translateY(-50%)'
                };
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
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
            <AnimatePresence>
                {!isDismissed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 pointer-events-auto"
                        style={maskStyle}
                        onClick={handleBackdropClick}
                    />
                )}
            </AnimatePresence>

            {/* Scout & Speech Bubble */}
            <AnimatePresence mode="wait">
                {!isDismissed && (
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
                            <div className={`absolute -top-12 left-6 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white transition-all duration-500 ${scoutMood === 'excited' ? 'bg-yellow-400' :
                                    scoutMood === 'concerned' ? 'bg-orange-500' :
                                        scoutMood === 'focused' ? 'bg-blue-600' :
                                            'bg-indigo-600'
                                }`}>
                                <Bot size={32} strokeWidth={2.5} />
                                {scoutMood === 'happy' && <span className="absolute -top-1 -right-1 text-xl animate-bounce">✨</span>}
                                {scoutMood === 'excited' && <span className="absolute -top-1 -right-1 text-xl animate-bounce">🎉</span>}
                                {scoutMood === 'concerned' && <span className="absolute -top-1 -right-1 text-xl animate-pulse">💡</span>}
                            </div>

                            <div className="mt-4">
                                <h4 className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full animate-pulse ${scoutMood === 'concerned' ? 'bg-orange-500' : 'bg-indigo-600'
                                        }`} />
                                    Scout's Advice (Llama 4)
                                </h4>
                                <div className="text-gray-800 leading-relaxed font-semibold text-lg">
                                    {isGenerating ? (
                                        <div className="flex items-center gap-2 text-gray-400 font-medium italic text-base">
                                            <span>Scout is thinking...</span>
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    ) : (
                                        scoutMessage
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-4">
                                <button
                                    onClick={endTour}
                                    className="text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors uppercase tracking-[0.2em]"
                                >
                                    End Tour
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        onClick={dismissStep}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-all uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                                    >
                                        Next
                                    </button>

                                    {currentStep.actionType === 'view' && (
                                        <button
                                            onClick={() => completeStep(currentStep.id)}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            Got it <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className={`absolute w-4 h-4 bg-white rotate-45 border-gray-100 border-l border-t shadow-[-2px_-2px_5px_rgba(0,0,0,0.02)]
                                ${currentStep.position === 'bottom' ? '-top-2 left-1/2 -ml-2 border-l border-t' : ''}
                                ${currentStep.position === 'top' ? '-bottom-2 left-1/2 -ml-2 border-r border-b' : ''}
                                ${currentStep.position === 'left' ? '-right-2 top-1/2 -mt-2 border-r border-t rotate-[135deg]' : ''}
                                ${currentStep.position === 'right' || !currentStep.position ? '-left-2 top-1/2 -mt-2' : ''}
                            `} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Minimized Scout when dismissed */}
            <AnimatePresence>
                {isDismissed && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, x: 20 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        exit={{ scale: 0, opacity: 0, x: 20 }}
                        className="absolute bottom-12 right-12 pointer-events-auto"
                    >
                        <button
                            onClick={() => setIsDismissed(false)}
                            className="group relative flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="bg-white/20 p-2 rounded-2xl">
                                <Bot size={28} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col items-start pr-1">
                                <span className="text-[10px] uppercase tracking-widest font-black opacity-70">Llama 4 Scout</span>
                                <span className="text-sm font-black whitespace-nowrap">Show Mission</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-[3px] border-white flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
