/**
 * RoomSwitcher.tsx
 * 
 * Bottom navigation component for switching between rooms in the Pet House Multi-Room Hub.
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
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 16,
            margin: '-20px -20px 20px -20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
            {ROOMS.map((room) => (
                <motion.button
                    key={room.id}
                    onClick={() => onRoomChange(room.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeRoom === room.id
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.5))'
                            : 'transparent',
                        color: activeRoom === room.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                        transition: 'all 0.2s ease',
                        minWidth: 70,
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>{room.emoji}</span>
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: activeRoom === room.id ? 600 : 400,
                        whiteSpace: 'nowrap',
                    }}>
                        {room.label}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}

export { ROOMS };
export default RoomSwitcher;
