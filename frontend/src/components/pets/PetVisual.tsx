/**
 * PetVisual Component
 * PHASE 3: PET VISUAL GROUNDING
 * 
 * Renders a pet visually inside its environment using pure React + CSS.
 * This is a VISUAL GROUNDING step ONLY - no gameplay mechanics, stats, or interactions.
 * 
 * Requirements:
 * - Pure React + CSS (NO Three.js, NO Canvas, NO WebGL)
 * - Accepts petType: 'dog' | 'cat' | 'panda'
 * - Uses CSS animations for subtle pet animations
 * - Renders pet inside environment based on petType
 */

import React from 'react';
import { getEnvironmentConfig, type EnvironmentConfig } from './environmentConfig';
import './PetVisual.css';

export type PetType = 'dog' | 'cat' | 'panda';

export interface PetVisualProps {
  petType: PetType;
}

// Pet emojis by type
const PET_EMOJI: Record<PetType, string> = {
  dog: '🐕',
  cat: '🐱',
  panda: '🐼',
};

/**
 * PetVisual Component
 * Renders a pet visually inside its themed environment
 */
export const PetVisual: React.FC<PetVisualProps> = ({ petType }) => {
  const environment = getEnvironmentConfig(petType);
  const petEmoji = PET_EMOJI[petType] || PET_EMOJI.dog;

  return (
    <div className="pet-visual-container">
      {/* Environment Background */}
      <EnvironmentRenderer environment={environment} />
      
      {/* Pet Sprite */}
      <PetSprite emoji={petEmoji} environment={environment} />
    </div>
  );
};

/**
 * EnvironmentRenderer Component
 * Renders the environment (room/background) based on environment config
 */
const EnvironmentRenderer: React.FC<{ environment: EnvironmentConfig }> = ({ environment }) => {
  return (
    <div 
      className="environment-renderer"
      style={{
        background: `linear-gradient(to bottom, ${environment.room.wallTop} 0%, ${environment.room.wallBottom} 50%, ${environment.room.floor} 50%, ${environment.room.floorLight} 100%)`,
      }}
    >
      {/* Floor Pattern */}
      <div 
        className="floor-pattern"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            ${environment.room.floor} 0px,
            ${environment.room.floorAccent} 2px,
            ${environment.room.floor} 4px
          )`,
        }}
      />

      {/* Window (if enabled) */}
      {environment.window.show && (
        <div className="window-container">
          <div 
            className="window"
            style={{
              background: environment.window.style === 'outdoor' 
                ? 'radial-gradient(circle, rgba(135, 206, 250, 0.3), rgba(176, 224, 230, 0.1))'
                : 'linear-gradient(to bottom, rgba(135, 206, 250, 0.2), rgba(255, 255, 255, 0.1))',
            }}
          >
            <div 
              className="sun"
              style={{
                background: environment.window.sunColor,
                boxShadow: `0 0 20px ${environment.window.sunColor}`,
              }}
            />
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      {environment.decorations.map((decoration, index) => (
        <div
          key={`decoration-${index}`}
          className="decoration"
          style={{
            ...decoration.position,
            opacity: decoration.opacity,
          }}
        >
          {decoration.emoji}
        </div>
      ))}

      {/* Zone Highlights (subtle background indicators) */}
      <div className="zone-highlights">
        <div 
          className="zone-highlight feed-zone"
          style={{
            left: environment.layout.feed.x,
            top: environment.layout.feed.y,
            backgroundColor: environment.floorHighlights.feed,
          }}
        />
        <div 
          className="zone-highlight rest-zone"
          style={{
            left: environment.layout.rest.x,
            top: environment.layout.rest.y,
            backgroundColor: environment.floorHighlights.rest,
          }}
        />
        <div 
          className="zone-highlight play-zone"
          style={{
            left: environment.layout.play.x,
            top: environment.layout.play.y,
            backgroundColor: environment.floorHighlights.play,
          }}
        />
        <div 
          className="zone-highlight clean-zone"
          style={{
            left: environment.layout.clean.x,
            top: environment.layout.clean.y,
            backgroundColor: environment.floorHighlights.clean,
          }}
        />
      </div>

      {/* Spotlight Effect */}
      <div 
        className="spotlight"
        style={{
          background: `radial-gradient(ellipse at center, ${environment.spotlight.color} 0%, transparent 70%)`,
          opacity: environment.spotlight.opacity,
        }}
      />
    </div>
  );
};

/**
 * PetSprite Component
 * Renders the pet with subtle idle animations
 */
const PetSprite: React.FC<{ emoji: string; environment: EnvironmentConfig }> = ({ 
  emoji, 
  environment 
}) => {
  return (
    <div className="pet-sprite-container">
      <div className="pet-sprite">
        <span className="pet-emoji" role="img" aria-label={`${environment.id} pet`}>
          {emoji}
        </span>
      </div>
      
      {/* Subtle shadow under pet */}
      <div className="pet-shadow" />
    </div>
  );
};

export default PetVisual;

