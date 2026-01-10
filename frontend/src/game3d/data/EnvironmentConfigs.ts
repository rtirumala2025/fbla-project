import type { ActivityZone } from '../core/SceneManager';
import { ACTIVITY_POSITIONS } from '../core/SceneManager';
import type { EnvironmentConfig, InteractiveZone } from '../core/InteractionSystem';

// --- DOG PARK (Town style) ---
// Uses existing ACTIVITY_POSITIONS
export const DOG_PARK_CONFIG: EnvironmentConfig = {
    bounds: { x: 50, z: 50 },
    zones: [
        { id: 'agility', position: ACTIVITY_POSITIONS.agility, label: 'Enter Training Center', icon: 'agility', interactionType: 'building', minDistance: 12 },
        { id: 'vet', position: ACTIVITY_POSITIONS.vet, label: 'Enter Vet Clinic', icon: 'vet', interactionType: 'building', minDistance: 12 },
        { id: 'play', position: ACTIVITY_POSITIONS.play, label: 'Enter Play Pavilion', icon: 'play', interactionType: 'building', minDistance: 12 },
        { id: 'rest', position: ACTIVITY_POSITIONS.rest, label: 'Enter Rest Shelter', icon: 'rest', interactionType: 'building', minDistance: 12 },
        { id: 'center', position: ACTIVITY_POSITIONS.center, label: 'Enter Park Hub', icon: 'center', interactionType: 'building', minDistance: 12 },
        { id: 'shop', position: ACTIVITY_POSITIONS.shop, label: 'Enter Gift Shop', icon: 'shop', interactionType: 'building', minDistance: 12 },
        { id: 'market', position: ACTIVITY_POSITIONS.market, label: 'Enter Supermarket', icon: 'market', interactionType: 'building', minDistance: 12 },
        { id: 'home', position: ACTIVITY_POSITIONS.home, label: 'Enter House', icon: 'home', interactionType: 'building', minDistance: 12 },
    ]
};

// --- CAT ROOM (Cozy, Furniture Interactions) ---
export const CAT_ROOM_CONFIG: EnvironmentConfig = {
    bounds: { x: 15, z: 15 },
    zones: [
        // Shop -> Laptop on Sofa
        {
            id: 'shop',
            position: [1.5, 0, 3.5],
            label: 'Use Tablet (Shop)',
            icon: 'shop',
            interactionType: 'object',
            minDistance: 3
        },
        // Agility -> Scratching Post
        {
            id: 'agility',
            position: [-4.0, 0, -2.0],
            label: 'Scratch Post',
            icon: 'agility',
            interactionType: 'object',
            minDistance: 3
        },
        // Vet -> Medical Kit (near Lamp area)
        {
            id: 'vet',
            position: [-5, 0, 2],
            label: 'Check Health',
            icon: 'vet',
            interactionType: 'object',
            minDistance: 3
        },
        // Market -> Food Bowls
        {
            id: 'market',
            position: [3.0, 0, -2.5],
            label: 'Refill Food',
            icon: 'market',
            interactionType: 'object',
            minDistance: 3
        },
        // Home -> Rug (Center)
        {
            id: 'home',
            position: [0, 0, 0],
            label: 'Nap on Rug',
            icon: 'home',
            interactionType: 'object',
            minDistance: 4
        }
    ]
};

// --- PANDA FOREST (Nature Stations) ---
export const PANDA_FOREST_CONFIG: EnvironmentConfig = {
    bounds: { x: 30, z: 30 },
    zones: [
        // Merchant Stall -> Shop
        {
            id: 'shop',
            position: [4, 0, 4],
            label: 'Trade with Merchant',
            icon: 'shop',
            interactionType: 'service',
            minDistance: 5
        },
        // Training Logs -> Agility
        {
            id: 'agility',
            position: [-4, 0, -4],
            label: 'Train on Logs',
            icon: 'agility',
            interactionType: 'object',
            minDistance: 5
        },
        // Hot Spring -> Vet
        {
            id: 'vet',
            position: [-6, 0, 6],
            label: 'Soak in Spring',
            icon: 'vet',
            interactionType: 'service',
            minDistance: 6
        },
        // Bamboo Pile -> Market
        {
            id: 'market',
            position: [0, 0, 5],
            label: 'Gather Bamboo',
            icon: 'market',
            interactionType: 'service',
            minDistance: 4
        },
        // Cave -> Home
        {
            id: 'home',
            position: [0, 0, -8],
            label: 'Enter Cave',
            icon: 'home',
            interactionType: 'building',
            minDistance: 6
        }
    ]
};
