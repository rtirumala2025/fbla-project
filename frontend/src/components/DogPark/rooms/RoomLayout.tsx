/**
 * RoomLayout.tsx
 * 
 * Full-Screen Flexbox Layout:
 * - Stage: flex-1, fills all available space above dock
 * - Dock: fixed h-[200px], pinned to bottom
 */

import React from 'react';
import { motion } from 'framer-motion';

export const ROOM_THEMES = {
    living: {
        gradient: 'bg-gradient-to-b from-indigo-950 via-purple-900 to-orange-900',
        accent: '#f59e0b',
    },
    kitchen: {
        gradient: 'bg-gradient-to-b from-orange-900 via-orange-600 to-amber-400',
        accent: '#f97316',
    },
    bathroom: {
        gradient: 'bg-gradient-to-b from-sky-900 via-cyan-600 to-cyan-300',
        accent: '#06b6d4',
    },
    closet: {
        gradient: 'bg-gradient-to-b from-slate-950 via-purple-950 to-indigo-950',
        accent: '#8b5cf6',
    },
} as const;

export type RoomTheme = keyof typeof ROOM_THEMES;

interface RoomLayoutProps {
    room: RoomTheme;
    stageContent: React.ReactNode;
    dockContent: React.ReactNode;
}

export function RoomLayout({ room, stageContent, dockContent }: RoomLayoutProps) {
    const theme = ROOM_THEMES[room];

    return (
        // Parent: fills entire modal content area
        <div className={`h-full w-full flex flex-col overflow-hidden ${theme.gradient}`}>
            {/* Stage: grows to fill available space */}
            <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden min-h-0">
                {/* Floor shadow effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                {/* Stage content - 3D pet, etc */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                    {stageContent}
                </div>
            </div>

            {/* Dock: fixed height, pinned to bottom */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-[200px] w-full shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 flex flex-col"
            >
                <div className="flex-1 px-6 py-4 overflow-hidden">
                    {dockContent}
                </div>
            </motion.div>
        </div>
    );
}

// Dock Item Card - Large, touch-friendly
interface DockItemCardProps {
    emoji: string;
    name: string;
    quantity?: number;
    isEquipped?: boolean;
    onClick: () => void;
    disabled?: boolean;
    accentColor?: string;
}

export function DockItemCard({
    emoji,
    name,
    quantity,
    isEquipped,
    onClick,
    disabled,
    accentColor = '#8b5cf6',
}: DockItemCardProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                min-w-[100px] h-[120px] p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0
                transition-all duration-200
                ${isEquipped
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ color: '#fff' }}
        >
            {isEquipped && (
                <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center text-xs"
                >
                    ✓
                </div>
            )}
            <span className="text-3xl">{emoji}</span>
            <span className="text-sm font-semibold truncate max-w-full">{name}</span>
            {quantity !== undefined && (
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded">
                    x{quantity}
                </span>
            )}
        </motion.button>
    );
}

export default RoomLayout;
