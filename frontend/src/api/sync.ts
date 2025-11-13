/**
 * API client for sync and offline features
 * Handles cloud sync state fetching and pushing
 */
import { apiRequest } from './httpClient';
import type { SyncFetchResponse, SyncPushRequest, SyncPushResponse } from '../types/sync';

export async function fetchCloudState(): Promise<SyncFetchResponse> {
  return apiRequest<SyncFetchResponse>('/api/sync');
}

export async function pushCloudState(payload: SyncPushRequest): Promise<SyncPushResponse> {
  return apiRequest<SyncPushResponse>('/api/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

