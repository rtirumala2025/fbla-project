export interface SyncSnapshot {
  pets: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
  quests: Array<Record<string, unknown>>;
  progress: Record<string, unknown>;
}

export interface CloudSyncState {
  snapshot: SyncSnapshot;
  last_modified: string;
  device_id: string;
  version: number;
}

export interface SyncFetchResponse {
  state: CloudSyncState;
  conflicts: Array<Record<string, unknown>>;
}

export interface SyncPushRequest {
  snapshot: SyncSnapshot;
  last_modified: string;
  device_id: string;
  version: number;
}

export interface SyncPushResponse {
  state: CloudSyncState;
  resolution: 'accepted' | 'merged' | 'ignored';
  conflicts: Array<Record<string, unknown>>;
}


