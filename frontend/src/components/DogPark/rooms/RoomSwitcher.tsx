/**
 * RoomSwitcher.tsx - Top navigation for room switching (positioned inside gradient)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sofa, UtensilsCrossed, Bath, Shirt } from 'lucide-react';

export type RoomType = 'living' | 'kitchen' | 'bathroom' | 'closet';

interface RoomConfig {
    id: RoomType;
    label: string;
    icon: React.ReactNode;
    emoji: string;
}

const ROOMS: RoomConfig[] = [
    { id: 'living', label: 'Living Room', icon: <Sofa size={20} />, emoji: '🛋️' },
    { id: 'kitchen', label: 'Kitchen', icon: <UtensilsCrossed size={20} />, emoji: '🍽️' },
    { id: 'bathroom', label: 'Bathroom', icon: <Bath size={20} />, emoji: '🛁' },
    { id: 'closet', label: 'Closet', icon: <Shirt size={20} />, emoji: '👕' },
];

interface RoomSwitcherProps {
    activeRoom: RoomType;
    onRoomChange: (room: RoomType) => void;
}

export function RoomSwitcher({ activeRoom, onRoomChange }: RoomSwitcherProps) {
    return (
        <div className="flex justify-center gap-2 py-3 shrink-0">
            {ROOMS.map((room) => (
                <motion.button
                    key={room.id}
                    onClick={() => onRoomChange(room.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border-none cursor-pointer transition-all min-w-[70px]
                        ${activeRoom === room.id
                            ? 'bg-white/20 text-white shadow-lg'
                            : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <span className="text-xl">{room.emoji}</span>
                    <span className={`text-xs whitespace-nowrap ${activeRoom === room.id ? 'font-semibold' : 'font-normal'}`}>
                        {room.label}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}

export { ROOMS };
export default RoomSwitcher;
