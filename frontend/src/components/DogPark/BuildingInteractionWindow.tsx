/**
 * BuildingInteractionWindow.tsx
 * 
 * Base modal component for all building interaction windows.
 * Features: draggable header, minimize/close, animations, focus trap
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';
import './building-windows.css';

export interface BuildingWindowProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: number | string;
    minHeight?: number;
}

export function BuildingInteractionWindow({
    isOpen,
    onClose,
    title,
    icon,
    children,
    footer,
    width = 600,
    minHeight = 400,
}: BuildingWindowProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const windowRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsMinimized(false);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && windowRef.current) {
            const focusableElements = windowRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            const handleTabKey = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        e.preventDefault();
                    }
                }
            };

            window.addEventListener('keydown', handleTabKey);
            firstElement?.focus();

            return () => window.removeEventListener('keydown', handleTabKey);
        }
    }, [isOpen]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);



    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="building-window-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleBackdropClick}
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby="building-window-title"
                >
                    <motion.div
                        ref={windowRef}
                        className={`building-window ${isMinimized ? 'minimized' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {/* Header */}
                        <div
                            className="building-window-header"
                        >
                            <div className="building-window-title" id="building-window-title">
                                <span className="building-window-title-icon">{icon}</span>
                                <span>{title}</span>
                            </div>
                            <div className="building-window-controls">
                                <button
                                    className="building-window-btn building-window-btn-minimize"
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                                    title={isMinimized ? 'Maximize' : 'Minimize'}
                                >
                                    {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                                </button>
                                <button
                                    className="building-window-btn building-window-btn-close"
                                    onClick={onClose}
                                    aria-label="Close"
                                    title="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Content - Hidden when minimized */}
                        <AnimatePresence>
                            {!isMinimized && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="building-window-content">
                                        {children}
                                    </div>

                                    {/* Footer */}
                                    {footer && (
                                        <div className="building-window-footer">
                                            {footer}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default BuildingInteractionWindow;
