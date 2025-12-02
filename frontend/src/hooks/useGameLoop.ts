/**
 * Hook to manage game loop lifecycle
 * 
 * Starts game loop on login, stops on logout
 * Handles app focus/blur events to catch up on missed time
 */

import { useEffect, useRef } from 'react';
import { gameLoopService } from '../services/gameLoopService';
import { saveService } from '../services/saveService';
import { logger } from '../utils/logger';

export function useGameLoop(userId: string | null | undefined) {
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      // User logged out - stop game loop and flush saves
      if (hasStartedRef.current) {
        gameLoopService.stop();
        saveService.flush().catch(err => {
          logger.error('Error flushing saves on logout', { error: err }, err);
        });
        hasStartedRef.current = false;
      }
      return;
    }

    // User logged in - start game loop
    if (!hasStartedRef.current) {
      gameLoopService.start(userId);
      hasStartedRef.current = true;
      logger.info('Game loop started via hook', { userId });
    }

    // Handle app focus - run game loop to catch up on missed time
    const handleFocus = () => {
      if (userId) {
        gameLoopService.runGameLoop().catch(err => {
          logger.error('Error running game loop on focus', { userId, error: err }, err);
        });
      }
    };

    // Handle app blur - flush pending saves
    const handleBlur = () => {
      saveService.flush().catch(err => {
        logger.error('Error flushing saves on blur', { error: err }, err);
      });
    };

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId) {
        gameLoopService.runGameLoop().catch(err => {
          logger.error('Error running game loop on visibility change', { userId, error: err }, err);
        });
      } else if (document.visibilityState === 'hidden') {
        saveService.flush().catch(err => {
          logger.error('Error flushing saves on visibility hidden', { error: err }, err);
        });
      }
    };

    // Handle beforeunload - flush saves before page closes
    const handleBeforeUnload = () => {
      saveService.flush().catch(err => {
        logger.error('Error flushing saves on beforeunload', { error: err }, err);
      });
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);
}
