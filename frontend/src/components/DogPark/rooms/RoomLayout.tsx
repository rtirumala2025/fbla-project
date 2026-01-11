/**
 * RoomLayout.tsx - Full-Screen Flexbox Layout
 * 
 * Structure:
 * - Parent: h-full w-full, gradient background
 * - Header: Room switcher (shrink-0)
 * - Stage: flex-1, 3D pet area
 * - Dock: h-[200px] shrink-0, controls
 */

import React from 'react';
import { motion } from 'framer-motion';

export const ROOM_THEMES = {
    living: {
        gradient: 'from-amber-950 via-orange-950 to-stone-900',
        accent: '#f59e0b',
    },
    kitchen: {
        gradient: 'from-slate-900 via-blue-950 to-sky-950',
        accent: '#f97316',
    },
    bathroom: {
        gradient: 'from-cyan-950 via-blue-950 to-cyan-900',
        accent: '#06b6d4',
    },
    closet: {
        gradient: 'from-zinc-900 via-neutral-950 to-black',
        accent: '#8b5cf6',
    },


} as const;

export type RoomTheme = keyof typeof ROOM_THEMES;

interface RoomLayoutProps {
    room: RoomTheme;
    header?: React.ReactNode; // Room switcher goes here
    stageContent: React.ReactNode;
    dockContent: React.ReactNode;
}

export function RoomLayout({ room, header, stageContent, dockContent }: RoomLayoutProps) {
    const theme = ROOM_THEMES[room];

    return (
        <div className={`h-full w-full flex flex-col overflow-hidden bg-gradient-to-b ${theme.gradient}`}>
            {/* Header - Room Switcher */}
            {header && (
                <div className="shrink-0 bg-black/20 border-b border-white/10">
                    {header}
                </div>
            )}

            {/* Stage - 3D Pet + Room Theme */}
            <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden min-h-0">
                {/* Floor shadow */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                    {stageContent}
                </div>
            </div>

            {/* Dock - Controls */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-[200px] w-full shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 flex flex-col px-6 py-4"
            >
                {dockContent}
            </motion.div>
        </div>
    );
}

// Dock Item Card
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
}: DockItemCardProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`min-w-[100px] h-[120px] p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shrink-0 relative
                ${isEquipped
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            {isEquipped && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center text-xs">
                    ✓
                </div>
            )}
            <span className="text-3xl">{emoji}</span>
            <span className="text-sm font-semibold truncate max-w-full text-white">{name}</span>
            {quantity !== undefined && (
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded">
                    x{quantity}
                </span>
            )}
        </motion.button>
    );
}

export default RoomLayout;
