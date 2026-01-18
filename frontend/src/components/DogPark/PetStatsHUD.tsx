/**
 * PetStatsHUD.tsx - Context-Aware Stats Display
 * 
 * A smart overlay that displays pet stats with location-based highlighting.
 * Stats relevant to the current room are prominently displayed.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Utensils, Zap, Smile, Droplets } from 'lucide-react';
import { usePet } from '../../context/PetContext';
import { STAT_DISPLAY_CONFIG, ROOM_STAT_HIGHLIGHTS, RoomType } from '../../config/gameConfig';

interface PetStatsHUDProps {
    currentRoom: RoomType;
    compact?: boolean; // For smaller displays
    className?: string;
}

// Icon mapping
const STAT_ICONS: Record<string, React.ElementType> = {
    health: Heart,
    hunger: Utensils,
    energy: Zap,
    happiness: Smile,
    cleanliness: Droplets,
};

export function PetStatsHUD({ currentRoom, compact = false, className = '' }: PetStatsHUDProps) {
    const { pet, loading } = usePet();

    if (loading || !pet) return null;

    const highlightedStats = ROOM_STAT_HIGHLIGHTS[currentRoom] || [];
    const stats = pet.stats;

    const statEntries = Object.entries(STAT_DISPLAY_CONFIG) as [keyof typeof STAT_DISPLAY_CONFIG, typeof STAT_DISPLAY_CONFIG[keyof typeof STAT_DISPLAY_CONFIG]][];

    return (
        <div className={`pointer-events-none ${className}`}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    bg-black/60 backdrop-blur-md rounded-xl border border-white/10
                    ${compact ? 'p-2' : 'p-3'}
                    flex flex-col gap-2
                `}
            >
                {statEntries.map(([key, config]) => {
                    const Icon = STAT_ICONS[key] || Heart;
                    const value = typeof stats[key as keyof typeof stats] === 'number'
                        ? (stats[key as keyof typeof stats] as number)
                        : 50;
                    const isHighlighted = highlightedStats.includes(key);
                    const isInverted = 'inverted' in config && config.inverted === true;
                    const displayValue = isInverted ? 100 - value : value;

                    return (
                        <motion.div
                            key={key}
                            animate={{
                                opacity: isHighlighted ? 1 : 0.6,
                                scale: isHighlighted ? 1 : 0.95,
                            }}
                            transition={{ duration: 0.3 }}
                            className={`flex items-center gap-2 ${compact ? 'min-w-[100px]' : 'min-w-[140px]'}`}
                        >
                            {/* Icon */}
                            <div
                                className={`
                                    flex items-center justify-center rounded-full
                                    ${isHighlighted ? 'ring-2 ring-white/30' : ''}
                                    ${compact ? 'w-5 h-5' : 'w-6 h-6'}
                                `}
                                style={{ backgroundColor: config.bgColor }}
                            >
                                <Icon
                                    size={compact ? 12 : 14}
                                    style={{ color: config.colorFrom }}
                                />
                            </div>

                            {/* Label and Bar */}
                            <div className="flex-1 flex flex-col gap-0.5">
                                {!compact && (
                                    <span className={`text-xs font-medium ${isHighlighted ? 'text-white' : 'text-white/70'}`}>
                                        {config.name}
                                    </span>
                                )}
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{
                                            background: `linear-gradient(90deg, ${config.colorFrom}, ${config.colorTo})`,
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${displayValue}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>

                            {/* Value */}
                            <span className={`text-xs font-bold ${isHighlighted ? 'text-white' : 'text-white/60'} ${compact ? 'w-6' : 'w-8'} text-right`}>
                                {Math.round(value)}
                            </span>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}

export default PetStatsHUD;
