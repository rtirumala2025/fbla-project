/**
 * RoomLayout.tsx
 * 
 * Stage + Dock layout wrapper for Pet House rooms.
 * Stage: Dynamic themed background with 3D pet (fills available space)
 * Dock: Fixed bottom panel for inventory
 */

import React from 'react';
import { motion } from 'framer-motion';

// Room theme configurations
export const ROOM_THEMES = {
    living: {
        stage: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 70%, #7c2d12 100%)',
        accent: '#f59e0b',
        label: 'Living Room',
    },
    kitchen: {
        stage: 'linear-gradient(180deg, #7c2d12 0%, #c2410c 30%, #ea580c 60%, #fbbf24 100%)',
        accent: '#f97316',
        label: 'Kitchen',
    },
    bathroom: {
        stage: 'linear-gradient(180deg, #0c4a6e 0%, #0369a1 30%, #0ea5e9 70%, #67e8f9 100%)',
        accent: '#06b6d4',
        label: 'Bathroom',
    },
    closet: {
        stage: 'radial-gradient(ellipse at 50% 30%, #4c1d95 0%, #1e1b4b 50%, #0f0f23 100%)',
        accent: '#8b5cf6',
        label: 'Closet',
    },
} as const;

export type RoomTheme = keyof typeof ROOM_THEMES;

interface RoomLayoutProps {
    room: RoomTheme;
    stageContent: React.ReactNode;
    dockContent: React.ReactNode;
}

export function RoomLayout({
    room,
    stageContent,
    dockContent,
}: RoomLayoutProps) {
    const theme = ROOM_THEMES[room];

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                // Use fixed heights that work within the modal window
                height: 'calc(100vh - 180px)', // Modal header + room switcher + padding
                maxHeight: 600, // Cap max height
                width: '100%',
                margin: '-28px -32px', // Negate parent padding to go edge-to-edge
                padding: 0,
            }}
        >
            {/* Stage: 3D Pet + Themed Background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    flex: 1,
                    minHeight: 280,
                    background: theme.stage,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Subtle overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 50%)',
                    pointerEvents: 'none',
                }} />

                {/* Floor effect */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '35%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)',
                    pointerEvents: 'none',
                }} />

                {stageContent}
            </motion.div>

            {/* Dock: Fixed bottom panel */}
            <div
                style={{
                    height: 180,
                    flexShrink: 0,
                    background: 'rgba(15, 15, 25, 0.95)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 24px',
                    overflow: 'hidden',
                }}
            >
                {dockContent}
            </div>
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
    accentColor = '#8b5cf6',
}: DockItemCardProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
                minWidth: 85,
                height: 90,
                padding: 8,
                borderRadius: 14,
                border: isEquipped
                    ? `2px solid ${accentColor}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                background: isEquipped
                    ? `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%)`
                    : 'rgba(255, 255, 255, 0.05)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                color: '#fff',
                opacity: disabled ? 0.5 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                flexShrink: 0,
                position: 'relative',
            }}
        >
            {isEquipped && (
                <div style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                }}>
                    ✓
                </div>
            )}
            <span style={{ fontSize: '1.8rem' }}>{emoji}</span>
            <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
            }}>
                {name}
            </span>
            {quantity !== undefined && (
                <span style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '1px 6px',
                    borderRadius: 4,
                }}>
                    x{quantity}
                </span>
            )}
        </motion.button>
    );
}

export default RoomLayout;
