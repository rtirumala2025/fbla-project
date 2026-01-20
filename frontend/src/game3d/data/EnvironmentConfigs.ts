import type { ActivityZone } from '../core/SceneManager';
import { ACTIVITY_POSITIONS } from '../core/SceneManager';
import type { EnvironmentConfig, InteractiveZone } from '../core/InteractionSystem';

// --- DOG PARK (Town style) ---
// Uses existing ACTIVITY_POSITIONS
export const DOG_PARK_CONFIG: EnvironmentConfig = {
    bounds: { x: 50, z: 50 },
    zones: [
        // Agility: [-25, 0, -25] + offset => [-14, 0, -14] approx
        { id: 'agility', position: [-14, 0, -14], label: 'Enter Training Center', icon: 'agility', interactionType: 'building', minDistance: 8 },
        // Vet: [-35, 0, 0] + offset => [-23, 0, 0]
        { id: 'vet', position: [-23, 0, 0], label: 'Enter Vet Clinic', icon: 'vet', interactionType: 'building', minDistance: 8 },
        // Play: [25, 0, -25] - Already valid
        { id: 'play', position: [25, 0, -25], label: 'Enter Play Pavilion', icon: 'play', interactionType: 'building', minDistance: 12 },
        // Rest: [35, 0, 0] - Already valid
        { id: 'rest', position: [35, 0, 0], label: 'Enter Rest Shelter', icon: 'rest', interactionType: 'building', minDistance: 12 },
        // Center: [-25, 0, 25] + offset => [-17, 0, 17]
        { id: 'center', position: [-17, 0, 17], label: 'Enter Park Hub', icon: 'center', interactionType: 'building', minDistance: 8 },
        // Shop: [25, 0, 25] + offset => [15, 0, 15]
        { id: 'shop', position: [15, 0, 15], label: 'Enter Gift Shop', icon: 'shop', interactionType: 'building', minDistance: 8 },
        // Market: [0, 0, 35] + offset => [0, 0, 21]
        { id: 'market', position: [0, 0, 21], label: 'Enter Supermarket', icon: 'market', interactionType: 'building', minDistance: 8 },
        // Home: [0, 0, -35] + offset => [0, 0, -22]
        { id: 'home', position: [0, 0, -22], label: 'Enter House', icon: 'home', interactionType: 'building', minDistance: 8 },
    ]
};

// --- CAT ROOM (Luxury Apartment) ---
export const CAT_ROOM_CONFIG: EnvironmentConfig = {
    bounds: { x: 50, z: 50 }, // Scaled up 2.5x
    zones: [
        // Shop -> Tech Station (Left Wall)
        {
            id: 'shop',
            position: [-40, 0, -10],
            label: 'Access Online Shop',
            icon: 'shop',
            interactionType: 'object',
            minDistance: 10
        },
        // Agility -> Cat Tree (Back Right)
        {
            id: 'agility',
            position: [35, 0, -30],
            label: 'Climb Cat Tree',
            icon: 'agility',
            interactionType: 'object',
            minDistance: 10
        },
        // Vet -> Wellness Spa (Front Left)
        {
            id: 'vet',
            position: [-35, 0, 30],
            label: 'Use Auto-Vet Station',
            icon: 'vet',
            interactionType: 'object',
            minDistance: 10
        },
        // Market -> Kitchenette (Front Right)
        {
            id: 'market',
            position: [35, 0, 30],
            label: 'Order Food',
            icon: 'market',
            interactionType: 'object',
            minDistance: 10
        },
        // Home -> Lounge (Center)
        {
            id: 'home',
            position: [0, 0, 5],
            label: 'Rest in Lounge',
            icon: 'home',
            interactionType: 'object',
            minDistance: 12
        }
    ]
};

// --- PANDA FOREST (Mystic Village) ---
export const PANDA_FOREST_CONFIG: EnvironmentConfig = {
    bounds: { x: 35, z: 35 },
    zones: [
        // Shop -> Merchant Cart (Left)
        {
            id: 'shop',
            position: [-15, 0, 0],
            label: 'Trade with Merchant',
            icon: 'shop',
            interactionType: 'service',
            minDistance: 6
        },
        // Agility -> Martial Arts Grounds (Right)
        {
            id: 'agility',
            position: [15, 0, -5],
            label: 'Train Kung Fu',
            icon: 'agility',
            interactionType: 'object',
            minDistance: 6
        },
        // Vet -> Hot Spring (Far Left)
        {
            id: 'vet',
            position: [-15, 0, 15],
            label: 'Heal in Spring',
            icon: 'vet',
            interactionType: 'service',
            minDistance: 7
        },
        // Market -> Spirit Bamboo (Center)
        {
            id: 'market',
            position: [0, 0, 5],
            label: 'Harvest Spirit Bamboo',
            icon: 'market',
            interactionType: 'service',
            minDistance: 5
        },
        // Home -> Shrine (Back)
        {
            id: 'home',
            position: [0, 0, -15],
            label: 'Enter Shrine',
            icon: 'home',
            interactionType: 'building',
            minDistance: 7
        }
    ]
};
