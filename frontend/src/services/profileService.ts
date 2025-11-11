import { apiRequest, ApiError } from '../api/httpClient';

export interface Preferences {
  sound: boolean;
  music: boolean;
  notifications: boolean;
  reduced_motion: boolean;
  high_contrast: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  coins: number;
  created_at?: string | null;
  updated_at?: string | null;
  preferences: Preferences;
}

export interface ProfileCreateInput {
  username: string;
  avatar_url?: string | null;
  preferences?: Partial<Preferences>;
}

export interface ProfileUpdateInput {
  username?: string;
  avatar_url?: string | null;
  preferences?: Partial<Preferences>;
  coins?: number;
}

const mapPreferences = (input: Partial<Preferences> | undefined): Preferences => ({
  sound: input?.sound ?? true,
  music: input?.music ?? true,
  notifications: input?.notifications ?? true,
  reduced_motion: input?.reduced_motion ?? false,
  high_contrast: input?.high_contrast ?? false,
});

const transformProfile = (data: any): Profile => ({
  id: data.user_id,
  user_id: data.user_id,
  username: data.username,
  avatar_url: data.avatar_url ?? null,
  coins: data.coins ?? 0,
  created_at: data.created_at ?? null,
  updated_at: data.updated_at ?? null,
  preferences: mapPreferences(data.preferences),
});

export const profileService = {
  async getProfile(_userId?: string): Promise<Profile | null> {
    try {
      const data = await apiRequest<any>('/api/profiles/me', { allowedStatuses: [404] });
      if (!data) {
        return null;
      }
      if (!(data as any).user_id) {
        return null;
      }
      return transformProfile(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createProfile(input: ProfileCreateInput | string): Promise<Profile> {
    const payload: ProfileCreateInput = typeof input === 'string' ? { username: input } : input;
    const data = await apiRequest<any>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify({
        username: payload.username,
        avatar_url: payload.avatar_url,
        preferences: payload.preferences,
      }),
    });
    return transformProfile(data);
  },

  async updateProfile(_userId: string, updates: ProfileUpdateInput): Promise<Profile> {
    const data = await apiRequest<any>('/api/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return transformProfile(data);
  },

  async deleteProfile(): Promise<void> {
    await apiRequest('/api/profiles/me', {
      method: 'DELETE',
    });
  },

  async updateUsername(_userId: string, username: string): Promise<Profile> {
    return this.updateProfile(_userId, { username });
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const data = await apiRequest<{ avatar_url: string }>('/api/profiles/me/avatar', {
      method: 'POST',
      body: formData,
    });
    return data.avatar_url;
  },

  async updateAvatar(_userId: string, file: File): Promise<Profile> {
    await this.uploadAvatar(file);
    const profile = await this.getProfile();
    if (!profile) {
      throw new Error('Profile not found after avatar upload');
    }
    return profile;
  },
};
