/**
 * Environment Configuration System
 * 
 * Maps pet types to their unique environment configurations.
 * All pets share the same gameplay logic, only visual/thematic elements differ.
 * 
 * DO NOT add game logic here — only visual/thematic data.
 */

// ============================================================================
// TYPES
// ============================================================================

export type PetType = 'dog' | 'cat' | 'panda' | 'default';

export interface RoomColors {
  wallTop: string;
  wallBottom: string;
  floor: string;
  floorLight: string;
  floorAccent: string;
}

export interface ZoneColors {
  feedZone: string;
  restZone: string;
  playZone: string;
  cleanZone: string;
}

export interface PropConfig {
  emoji: string;
  secondaryEmoji?: string;
  label: string;
  description: string;
  actionEmoji: string[];
}

export interface ZonePosition {
  x: string;
  y: string;
}

export interface ZoneLayout {
  feed: ZonePosition;
  rest: ZonePosition;
  play: ZonePosition;
  clean: ZonePosition;
}

export interface Decoration {
  emoji: string;
  position: { left?: string; right?: string; top?: string; bottom?: string };
  opacity: number;
}

export interface WindowConfig {
  show: boolean;
  style: 'indoor' | 'outdoor' | 'minimal';
  sunColor: string;
}

export interface EnvironmentConfig {
  // Metadata
  id: PetType;
  name: string;
  mood: 'playful' | 'cozy' | 'calm' | 'natural';
  description: string;

  // Visual theme
  room: RoomColors;
  zones: ZoneColors;
  
  // Zone label colors (for the floating labels)
  zoneLabels: {
    feed: string;
    rest: string;
    play: string;
    clean: string;
  };

  // Interactive props (one per action)
  props: {
    feed: PropConfig;
    rest: PropConfig;
    play: PropConfig;
    bathe: PropConfig;
  };

  // Zone positions (consistent layout across pets)
  layout: ZoneLayout;

  // Decorative elements
  decorations: Decoration[];
  window: WindowConfig;

  // Floor highlight colors for zone mats
  floorHighlights: {
    feed: string;
    rest: string;
    play: string;
    clean: string;
  };

  // Spotlight config
  spotlight: {
    color: string;
    opacity: number;
  };
}

// ============================================================================
// SHARED DEFAULTS
// ============================================================================

const DEFAULT_LAYOUT: ZoneLayout = {
  feed: { x: '18%', y: '78%' },
  rest: { x: '82%', y: '78%' },
  play: { x: '82%', y: '48%' },
  clean: { x: '18%', y: '48%' },
};

const OBJECT_SIZE = '64px';

// ============================================================================
// DOG ENVIRONMENT — Playful, Indoor Home
// ============================================================================

const DOG_ENVIRONMENT: EnvironmentConfig = {
  id: 'dog',
  name: 'Cozy Home',
  mood: 'playful',
  description: 'A warm, playful indoor space perfect for an energetic pup',

  room: {
    wallTop: '#B4D7E8',      // Soft sky blue
    wallBottom: '#D4E5EF',   // Very light blue
    floor: '#C9A87C',        // Warm light wood
    floorLight: '#D9BC94',   // Lighter wood
    floorAccent: '#B89A6D',  // Wood grain accent
  },

  zones: {
    feedZone: 'rgba(255, 183, 71, 0.12)',
    restZone: 'rgba(167, 139, 250, 0.10)',
    playZone: 'rgba(74, 222, 128, 0.10)',
    cleanZone: 'rgba(56, 189, 248, 0.10)',
  },

  zoneLabels: {
    feed: '#FFB347',
    rest: '#A78BFA',
    play: '#4ADE80',
    clean: '#38BDF8',
  },

  props: {
    feed: {
      emoji: '🍖',
      secondaryEmoji: '🥣',
      label: 'Food Bowl',
      description: 'Tap to feed!',
      actionEmoji: ['🍖', '🥩', '✨', '💕'],
    },
    rest: {
      emoji: '🛏️',
      secondaryEmoji: '🌙',
      label: 'Cozy Bed',
      description: 'Tap to rest!',
      actionEmoji: ['💤', '😴', '🌙', '⭐'],
    },
    play: {
      emoji: '🎾',
      secondaryEmoji: '🧸',
      label: 'Toy Box',
      description: 'Tap to play!',
      actionEmoji: ['🎾', '⭐', '🎉', '💫'],
    },
    bathe: {
      emoji: '🛁',
      secondaryEmoji: '🧼',
      label: 'Bath Time',
      description: 'Tap to bathe!',
      actionEmoji: ['🛁', '🧼', '💧', '✨'],
    },
  },

  layout: DEFAULT_LAYOUT,

  decorations: [
    { emoji: '🥣', position: { left: '8%', bottom: '18%' }, opacity: 0.4 },
    { emoji: '⭐', position: { right: '8%', bottom: '18%' }, opacity: 0.4 },
    { emoji: '🎈', position: { right: '8%', top: '35%' }, opacity: 0.4 },
    { emoji: '💧', position: { left: '8%', top: '35%' }, opacity: 0.4 },
  ],

  window: {
    show: true,
    style: 'indoor',
    sunColor: 'rgba(253, 224, 71, 0.8)',
  },

  floorHighlights: {
    feed: 'rgba(255, 183, 71, 0.12)',
    rest: 'rgba(167, 139, 250, 0.10)',
    play: 'rgba(74, 222, 128, 0.10)',
    clean: 'rgba(56, 189, 248, 0.10)',
  },

  spotlight: {
    color: 'rgba(255, 255, 255, 0.15)',
    opacity: 1,
  },
};

// ============================================================================
// CAT ENVIRONMENT — Cozy, Vertical, Calm
// ============================================================================

const CAT_ENVIRONMENT: EnvironmentConfig = {
  id: 'cat',
  name: 'Cozy Nook',
  mood: 'cozy',
  description: 'A warm, enclosed space with soft textures and elevated spots',

  room: {
    wallTop: '#E8D4C4',      // Warm cream
    wallBottom: '#F0E6DC',   // Lighter cream
    floor: '#D4A574',        // Warm terracotta/wood
    floorLight: '#E0B88A',   // Lighter warm
    floorAccent: '#C49565',  // Warm accent
  },

  zones: {
    feedZone: 'rgba(255, 160, 122, 0.14)',   // Salmon tint
    restZone: 'rgba(221, 160, 221, 0.12)',   // Lavender tint
    playZone: 'rgba(255, 215, 0, 0.10)',     // Gold tint
    cleanZone: 'rgba(176, 224, 230, 0.12)',  // Powder blue tint
  },

  zoneLabels: {
    feed: '#FF8C69',
    rest: '#DDA0DD',
    play: '#FFD700',
    clean: '#87CEEB',
  },

  props: {
    feed: {
      emoji: '🐟',
      secondaryEmoji: '🍽️',
      label: 'Food Dish',
      description: 'Tap to feed!',
      actionEmoji: ['🐟', '🐠', '✨', '😻'],
    },
    rest: {
      emoji: '🛋️',
      secondaryEmoji: '💤',
      label: 'Cushion',
      description: 'Tap to rest!',
      actionEmoji: ['💤', '😸', '🌙', '💫'],
    },
    play: {
      emoji: '🧶',
      secondaryEmoji: '🪶',
      label: 'Yarn Ball',
      description: 'Tap to play!',
      actionEmoji: ['🧶', '🪶', '🎀', '✨'],
    },
    bathe: {
      emoji: '🪮',
      secondaryEmoji: '✨',
      label: 'Grooming',
      description: 'Tap to groom!',
      actionEmoji: ['🪮', '✨', '💅', '🌸'],
    },
  },

  layout: DEFAULT_LAYOUT,

  decorations: [
    { emoji: '🐾', position: { left: '8%', bottom: '18%' }, opacity: 0.35 },
    { emoji: '🌙', position: { right: '8%', bottom: '18%' }, opacity: 0.35 },
    { emoji: '🪴', position: { right: '8%', top: '35%' }, opacity: 0.4 },
    { emoji: '🕯️', position: { left: '8%', top: '35%' }, opacity: 0.35 },
  ],

  window: {
    show: true,
    style: 'indoor',
    sunColor: 'rgba(255, 218, 185, 0.7)',
  },

  floorHighlights: {
    feed: 'rgba(255, 160, 122, 0.14)',
    rest: 'rgba(221, 160, 221, 0.12)',
    play: 'rgba(255, 215, 0, 0.10)',
    clean: 'rgba(176, 224, 230, 0.12)',
  },

  spotlight: {
    color: 'rgba(255, 248, 240, 0.12)',
    opacity: 1,
  },
};

// ============================================================================
// PANDA ENVIRONMENT — Natural, Peaceful, Grounded
// ============================================================================

const PANDA_ENVIRONMENT: EnvironmentConfig = {
  id: 'panda',
  name: 'Bamboo Grove',
  mood: 'natural',
  description: 'A peaceful nature-inspired space with greenery and calm',

  room: {
    wallTop: '#C8E6C9',      // Soft sage green
    wallBottom: '#E8F5E9',   // Very light green
    floor: '#A5D6A7',        // Grass green
    floorLight: '#C8E6C9',   // Lighter grass
    floorAccent: '#81C784',  // Deeper green accent
  },

  zones: {
    feedZone: 'rgba(139, 195, 74, 0.15)',    // Lime green tint
    restZone: 'rgba(165, 214, 167, 0.12)',   // Soft green tint
    playZone: 'rgba(255, 241, 118, 0.10)',   // Soft yellow tint
    cleanZone: 'rgba(129, 212, 250, 0.10)',  // Light blue tint
  },

  zoneLabels: {
    feed: '#8BC34A',
    rest: '#66BB6A',
    play: '#FFEB3B',
    clean: '#4FC3F7',
  },

  props: {
    feed: {
      emoji: '🎋',
      secondaryEmoji: '🥬',
      label: 'Bamboo',
      description: 'Tap to feed!',
      actionEmoji: ['🎋', '🥬', '🌿', '💚'],
    },
    rest: {
      emoji: '🪨',
      secondaryEmoji: '🌸',
      label: 'Rock Bed',
      description: 'Tap to rest!',
      actionEmoji: ['💤', '🌸', '🌙', '☁️'],
    },
    play: {
      emoji: '🪵',
      secondaryEmoji: '🌺',
      label: 'Log Roll',
      description: 'Tap to play!',
      actionEmoji: ['🪵', '🌺', '🎉', '🌈'],
    },
    bathe: {
      emoji: '💧',
      secondaryEmoji: '🍃',
      label: 'Stream',
      description: 'Tap to bathe!',
      actionEmoji: ['💧', '🍃', '💦', '✨'],
    },
  },

  layout: DEFAULT_LAYOUT,

  decorations: [
    { emoji: '🎋', position: { left: '5%', bottom: '25%' }, opacity: 0.5 },
    { emoji: '🌸', position: { right: '5%', bottom: '25%' }, opacity: 0.45 },
    { emoji: '🦋', position: { right: '10%', top: '30%' }, opacity: 0.4 },
    { emoji: '🍃', position: { left: '10%', top: '30%' }, opacity: 0.45 },
  ],

  window: {
    show: false,
    style: 'outdoor',
    sunColor: 'rgba(255, 255, 200, 0.6)',
  },

  floorHighlights: {
    feed: 'rgba(139, 195, 74, 0.15)',
    rest: 'rgba(165, 214, 167, 0.12)',
    play: 'rgba(255, 241, 118, 0.10)',
    clean: 'rgba(129, 212, 250, 0.10)',
  },

  spotlight: {
    color: 'rgba(200, 255, 200, 0.10)',
    opacity: 1,
  },
};

// ============================================================================
// ENVIRONMENT REGISTRY
// ============================================================================

export const ENVIRONMENTS: Record<PetType, EnvironmentConfig> = {
  dog: DOG_ENVIRONMENT,
  cat: CAT_ENVIRONMENT,
  panda: PANDA_ENVIRONMENT,
  default: DOG_ENVIRONMENT, // Fallback to dog
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get environment config for a pet type
 * Falls back to dog environment if pet type is unknown
 */
export function getEnvironmentConfig(petType: string): EnvironmentConfig {
  const normalizedType = petType.toLowerCase() as PetType;
  return ENVIRONMENTS[normalizedType] || ENVIRONMENTS.default;
}

/**
 * Get world objects for a specific environment
 * Merges layout positions with prop configurations
 */
export function getWorldObjects(config: EnvironmentConfig) {
  return [
    {
      id: 'feed' as const,
      ...config.props.feed,
      position: config.layout.feed,
      size: OBJECT_SIZE,
      zone: 'feed' as const,
    },
    {
      id: 'rest' as const,
      ...config.props.rest,
      position: config.layout.rest,
      size: OBJECT_SIZE,
      zone: 'rest' as const,
    },
    {
      id: 'play' as const,
      ...config.props.play,
      position: config.layout.play,
      size: OBJECT_SIZE,
      zone: 'play' as const,
    },
    {
      id: 'bathe' as const,
      ...config.props.bathe,
      position: config.layout.clean,
      size: OBJECT_SIZE,
      zone: 'clean' as const,
    },
  ];
}

/**
 * Get zone label data for environment
 */
export function getZoneLabels(config: EnvironmentConfig) {
  return [
    { label: 'Feed', emoji: config.props.feed.emoji, position: { left: '13%', bottom: '28%' }, color: config.zoneLabels.feed },
    { label: 'Rest', emoji: config.props.rest.emoji.includes('💤') ? '💤' : config.props.rest.emoji, position: { right: '13%', bottom: '28%' }, color: config.zoneLabels.rest },
    { label: 'Play', emoji: config.props.play.emoji, position: { right: '13%', top: '32%' }, color: config.zoneLabels.play },
    { label: 'Clean', emoji: '✨', position: { left: '13%', top: '32%' }, color: config.zoneLabels.clean },
  ];
}

// Export size constant for use in components
export { OBJECT_SIZE };

