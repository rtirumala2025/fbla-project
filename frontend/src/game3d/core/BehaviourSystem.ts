import type { PetStats } from '../../types/pet';

// AAA EMOTIONAL POSTURE SYSTEM
export interface EmotionalPose {
    spine_curve: number;         // rad, + = arch back, - = hunch
    chest_expansion: number;     // scale multiplier
    head_pitch: number;          // rad, + = chin up, - = down
    head_roll: number;           // rad, asymmetry tilt
    weight_forward: number;      // 0-1, front vs rear load
    tail_offset: number;         // rad from breed default
    tail_wag_speed: number;      // Hz
    tail_wag_amp: number;        // amplitude  
    ear_tension: number;         // 0-1, perked vs relaxed
    shoulder_hunch: number;      // scale.x modifier
    breathing_rate: number;      // multiplier vs base 1.6Hz
    micro_movement_scale: number; // fidget amplitude
    eye_squint: number;           // 0-1, closed to open
    mouth_open: number;           // 0-1, closed to panting
}

export const EMOTIONAL_POSES: Record<string, EmotionalPose> = {
    happy: {
        spine_curve: +0.08,
        chest_expansion: 1.08,
        head_pitch: -0.12,
        head_roll: 0.03,
        weight_forward: 0.72,
        tail_offset: +0.25,
        tail_wag_speed: 9.0,
        tail_wag_amp: 0.65,
        ear_tension: 0.85,
        shoulder_hunch: 1.0,
        breathing_rate: 1.25,
        micro_movement_scale: 1.8,
        eye_squint: 0.8, // Relaxed happy squint
        mouth_open: 1.0,  // Happy panting
    },
    sad: {
        spine_curve: -0.15,
        chest_expansion: 0.88,
        head_pitch: +0.22,
        head_roll: -0.02,
        weight_forward: 0.48,
        tail_offset: -0.35,
        tail_wag_speed: 0,
        tail_wag_amp: 0,
        ear_tension: 0.15,
        shoulder_hunch: 0.92,
        breathing_rate: 0.75,
        micro_movement_scale: 0.35,
        eye_squint: 0.4, // Droopy eyes
        mouth_open: 0.0,
    },
    energetic: {
        spine_curve: -0.05,
        chest_expansion: 0.95,
        head_pitch: -0.18,
        head_roll: 0.0,
        weight_forward: 0.78,
        tail_offset: +0.30,
        tail_wag_speed: 12.0,
        tail_wag_amp: 0.45,
        ear_tension: 0.95,
        shoulder_hunch: 1.05,
        breathing_rate: 1.45,
        micro_movement_scale: 2.5,
        eye_squint: 1.0, // Alert wide eyes
        mouth_open: 0.5, // Slight open
    },
    sick: {
        spine_curve: -0.22,
        chest_expansion: 0.82,
        head_pitch: +0.30,
        head_roll: -0.08,
        weight_forward: 0.40,
        tail_offset: -0.45,
        tail_wag_speed: 0,
        tail_wag_amp: 0,
        ear_tension: 0.08,
        shoulder_hunch: 0.85,
        breathing_rate: 0.65,
        micro_movement_scale: 0.15,
        eye_squint: 0.1, // Near closed
        mouth_open: 0.2, // Labored gasp
    },
    neutral: {
        spine_curve: 0,
        chest_expansion: 1.0,
        head_pitch: 0,
        head_roll: 0,
        weight_forward: 0.62,
        tail_offset: 0,
        tail_wag_speed: 8.0,
        tail_wag_amp: 0.5,
        ear_tension: 0.5,
        shoulder_hunch: 1.0,
        breathing_rate: 1.0,
        micro_movement_scale: 1.0,
        eye_squint: 1.0, // Open
        mouth_open: 0.0,
    },
};

export function getEmotionalPose(stats: PetStats | null | undefined): EmotionalPose {
    if (!stats) return EMOTIONAL_POSES.neutral;

    const happiness = stats.happiness ?? 50;
    const energy = stats.energy ?? 50;
    // Handle both cleanliness (frontend) and hygiene (backend) keys
    const hygiene = (stats as any).cleanliness ?? (stats as any).hygiene ?? 50;

    // Sick state (low hygiene or health)
    if (hygiene < 30) {
        return EMOTIONAL_POSES.sick;
    }

    // Sad state (low happiness)
    if (happiness < 35) {
        return EMOTIONAL_POSES.sad;
    }

    // Energetic state (high energy + high happiness)
    if (energy > 70 && happiness > 65) {
        return EMOTIONAL_POSES.energetic;
    }

    // Happy state (high happiness)
    if (happiness > 65) {
        return EMOTIONAL_POSES.happy;
    }

    // Default neutral
    return EMOTIONAL_POSES.neutral;
}

// Simple 1D Perlin noise for organic head drift
export function perlinNoise1D(x: number, seed: number = 0): number {
    const xi = Math.floor(x);
    const xf = x - xi;
    const u = xf * xf * (3.0 - 2.0 * xf); // Smoothstep

    const hash = (n: number) => {
        const h = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
        return h - Math.floor(h);
    };

    const a = hash(xi);
    const b = hash(xi + 1);
    return a * (1 - u) + b * u;
}

// Accessory data from equipped items
export interface EquippedAccessory {
    id: string;
    slot: 'collar' | 'hat' | 'bandana' | 'glasses' | 'back';
    color: string;
    name?: string;
}
