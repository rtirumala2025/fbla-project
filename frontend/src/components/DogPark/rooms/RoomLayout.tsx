/**
 * RoomLayout.tsx
 * 
 * Stage + Dock layout wrapper for Pet House rooms.
 * Stage: Dynamic themed background with 3D pet (70% height)
 * Dock: Glassmorphism bottom panel for inventory (30% height)
 */

import React from 'react';
import { motion } from 'framer-motion';

// Room theme configurations with Tailwind-compatible CSS
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
        // Radial spotlight effect
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
    dockHeight?: string; // e.g., '30%' or '280px'
}

export function RoomLayout({
    room,
    stageContent,
    dockContent,
    dockHeight = '30%',
}: RoomLayoutProps) {
    const theme = ROOM_THEMES[room];

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 120px)', // Account for header + room switcher
                width: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Stage: 3D Pet + Themed Background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    flex: 1,
                    background: theme.stage,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 0,
                }}
            >
                {/* Subtle pattern overlay for depth */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(circle at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 50%),
                        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03) 0%, transparent 30%)
                    `,
                    pointerEvents: 'none',
                }} />

                {/* Floor/Ground effect */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                    pointerEvents: 'none',
                }} />

                {stageContent}
            </motion.div>

            {/* Dock: Glassmorphism Interaction Panel */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                    height: dockHeight,
                    minHeight: 200,
                    maxHeight: 320,
                    background: 'rgba(15, 15, 25, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 24px',
                    overflow: 'hidden',
                }}
            >
                {dockContent}
            </motion.div>
        </div>
    );
}

// Reusable Dock Item Card
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
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            style={{
                minWidth: 100,
                height: 110,
                padding: 12,
                borderRadius: 16,
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
                gap: 6,
                flexShrink: 0,
                position: 'relative',
                boxShadow: isEquipped
                    ? `0 4px 20px ${accentColor}44`
                    : '0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            {isEquipped && (
                <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                }}>
                    ✓
                </div>
            )}
            <span style={{ fontSize: '2rem' }}>{emoji}</span>
            <span style={{
                fontSize: '0.8rem',
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
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 6,
                }}>
                    x{quantity}
                </span>
            )}
        </motion.button>
    );
}

export default RoomLayout;
