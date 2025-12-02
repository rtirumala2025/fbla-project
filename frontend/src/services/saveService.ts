/**
 * Modular save service for consistent, debounced, and automatic saves.
 * 
 * Features:
 * - Queue-based saves to prevent race conditions
 * - Debouncing to batch rapid updates
 * - Automatic saves after actions
 * - Error handling with retries
 * - Non-blocking UI operations
 */

import { supabase, isSupabaseMock } from '../lib/supabase';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/networkUtils';

export interface SaveOperation {
  id: string;
  type: 'pet' | 'profile' | 'quest' | 'finance';
  entityId: string;
  data: Record<string, any>;
  timestamp: number;
  retries: number;
}

export interface SaveServiceConfig {
  debounceMs: number;
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
}

const DEFAULT_CONFIG: SaveServiceConfig = {
  debounceMs: 500, // Wait 500ms before saving to batch rapid updates
  maxRetries: 3,
  retryDelayMs: 1000,
  batchSize: 10, // Process up to 10 saves at once
};

class SaveService {
  private queue: Map<string, SaveOperation> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private processing: boolean = false;
  private config: SaveServiceConfig;

  constructor(config: Partial<SaveServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Queue a save operation. If an operation for the same entity is already queued,
   * it will be merged (latest data wins).
   */
  queueSave(
    type: SaveOperation['type'],
    entityId: string,
    data: Record<string, any>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const operationId = `${type}:${entityId}`;
      
      // Merge with existing operation if present
      const existing = this.queue.get(operationId);
      const mergedData = existing
        ? { ...existing.data, ...data, updated_at: new Date().toISOString() }
        : { ...data, updated_at: new Date().toISOString() };

      const operation: SaveOperation = {
        id: operationId,
        type,
        entityId,
        data: mergedData,
        timestamp: Date.now(),
        retries: existing?.retries || 0,
      };

      this.queue.set(operationId, operation);

      // Clear existing debounce timer
      const existingTimer = this.debounceTimers.get(operationId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        this.debounceTimers.delete(operationId);
        this.processQueue().then(resolve).catch(reject);
      }, this.config.debounceMs);

      this.debounceTimers.set(operationId, timer);
    });
  }

  /**
   * Immediately save without debouncing (for critical operations)
   */
  async saveImmediate(
    type: SaveOperation['type'],
    entityId: string,
    data: Record<string, any>
  ): Promise<void> {
    // Clear any pending debounced save for this entity
    const operationId = `${type}:${entityId}`;
    const timer = this.debounceTimers.get(operationId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(operationId);
    }

    // Remove from queue if present
    this.queue.delete(operationId);

    // Save immediately
    await this.executeSave(type, entityId, data);
  }

  /**
   * Process the save queue in batches
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.size === 0) {
      return;
    }

    this.processing = true;

    try {
      // Get operations to process (up to batchSize)
      const operations = Array.from(this.queue.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, this.config.batchSize);

      // Process in parallel
      const results = await Promise.allSettled(
        operations.map(op => this.executeSave(op.type, op.entityId, op.data))
      );

      // Remove successful operations from queue
      results.forEach((result, index) => {
        const operation = operations[index];
        if (result.status === 'fulfilled') {
          this.queue.delete(operation.id);
        } else {
          // Retry failed operations
          this.handleSaveError(operation, result.reason);
        }
      });

      // Process remaining queue if any
      if (this.queue.size > 0) {
        // Use setTimeout to yield to UI thread
        setTimeout(() => {
          this.processing = false;
          this.processQueue();
        }, 0);
      } else {
        this.processing = false;
      }
    } catch (error) {
      logger.error('Error processing save queue', { error }, error instanceof Error ? error : undefined);
      this.processing = false;
    }
  }

  /**
   * Execute a single save operation
   */
  private async executeSave(
    type: SaveOperation['type'],
    entityId: string,
    data: Record<string, any>
  ): Promise<void> {
    if (isSupabaseMock()) {
      logger.debug('Skipping save in mock mode', { type, entityId });
      return;
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      let query;

      switch (type) {
        case 'pet':
          query = supabase
            .from('pets')
            .update(data)
            .eq('id', entityId);
          break;

        case 'profile':
          query = supabase
            .from('profiles')
            .update(data)
            .eq('user_id', entityId);
          break;

        case 'quest':
          query = supabase
            .from('user_quests')
            .update(data)
            .eq('id', entityId);
          break;

        case 'finance':
          query = supabase
            .from('transactions')
            .insert(data);
          break;

        default:
          throw new Error(`Unknown save type: ${type}`);
      }

      const { error } = await query;

      if (error) {
        throw new Error(getErrorMessage(error, `Failed to save ${type}`));
      }

      logger.debug('Save successful', { type, entityId });
    } catch (error) {
      logger.error('Save failed', { type, entityId, error }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Handle save errors with retry logic
   */
  private handleSaveError(operation: SaveOperation, error: any): void {
    if (operation.retries >= this.config.maxRetries) {
      logger.error('Save failed after max retries', {
        operation,
        error,
      });
      // Remove from queue to prevent infinite retries
      this.queue.delete(operation.id);
      return;
    }

    // Increment retries and re-queue
    operation.retries++;
    operation.timestamp = Date.now();

    // Retry after delay
    setTimeout(() => {
      this.executeSave(operation.type, operation.entityId, operation.data)
        .then(() => {
          this.queue.delete(operation.id);
        })
        .catch((retryError) => {
          this.handleSaveError(operation, retryError);
        });
    }, this.config.retryDelayMs * operation.retries);
  }

  /**
   * Flush all pending saves (useful before logout or app close)
   */
  async flush(): Promise<void> {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Process all remaining saves
    while (this.queue.size > 0) {
      await this.processQueue();
    }
  }

  /**
   * Get current queue size (for debugging/monitoring)
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Clear the queue (use with caution)
   */
  clearQueue(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.queue.clear();
  }
}

// Singleton instance
export const saveService = new SaveService();
