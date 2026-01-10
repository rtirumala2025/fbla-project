import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus management
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="dialog"
                    aria-modal="true"
                >
                    <motion.div
                        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 mx-4"
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="p-6">
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {isDangerous && (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        </div>
                                    )}
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        {title}
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="mb-8 text-slate-600 dark:text-slate-300 leading-relaxed">
                                {message}
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    ref={confirmButtonRef}
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${isDangerous
                                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
