import { profileService } from '../services/profileService';

const { mockApiRequest, MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    status: number;
    constructor(status: number) {
      super(`API error ${status}`);
      this.status = status;
    }
  }

  return {
    mockApiRequest: vi.fn(),
    MockApiError,
  };
});

vi.mock('../api/httpClient', () => ({
  apiRequest: (path: string, options?: unknown) => mockApiRequest(path, options),
  ApiError: MockApiError,
}));

describe('profileService', () => {
  const mockUserId = 'test-user-123';
  const baseResponse = {
    user_id: mockUserId,
    username: 'newUsername',
    avatar_url: null,
    coins: 100,
    preferences: {
      sound: true,
      music: true,
      notifications: true,
      reduced_motion: false,
      high_contrast: false,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updateUsername updates profile in database', async () => {
    mockApiRequest.mockResolvedValueOnce(baseResponse);

    const result = await profileService.updateUsername(mockUserId, baseResponse.username);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/profiles/me',
      expect.objectContaining({
        method: 'PUT',
      }),
    );

    const [, options] = mockApiRequest.mock.calls[0];
    expect(options).toBeDefined();
    expect(JSON.parse((options as Record<string, unknown>).body as string)).toMatchObject({
      username: baseResponse.username,
    });

    expect(result).toMatchObject({
      user_id: mockUserId,
      username: baseResponse.username,
      coins: baseResponse.coins,
    });
  });

  test('getProfile fetches profile from database', async () => {
    mockApiRequest.mockResolvedValueOnce(baseResponse);

    const result = await profileService.getProfile(mockUserId);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/profiles/me',
      expect.objectContaining({
        allowedStatuses: [404],
      }),
    );

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      user_id: mockUserId,
      username: baseResponse.username,
    });
  });

  test('getProfile returns null when API responds with 404', async () => {
    mockApiRequest.mockRejectedValueOnce(new MockApiError(404));

    const result = await profileService.getProfile(mockUserId);

    expect(result).toBeNull();
  });

  test('createProfile accepts username string input', async () => {
    mockApiRequest.mockResolvedValueOnce(baseResponse);

    const result = await profileService.createProfile(baseResponse.username);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/profiles',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result.username).toBe(baseResponse.username);
  });

  test('deleteProfile issues a DELETE request', async () => {
    mockApiRequest.mockResolvedValueOnce(undefined);

    await profileService.deleteProfile();

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/profiles/me',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('uploadAvatar posts multipart data and returns url', async () => {
    mockApiRequest.mockResolvedValueOnce({ avatar_url: 'https://cdn/avatar.png' });
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    const url = await profileService.uploadAvatar(file);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/profiles/me/avatar',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(url).toBe('https://cdn/avatar.png');
  });

  test('updateAvatar uploads and returns refreshed profile', async () => {
    mockApiRequest
      .mockResolvedValueOnce({ avatar_url: 'https://cdn/avatar.png' })
      .mockResolvedValueOnce(baseResponse);
    const getProfileSpy = vi.spyOn(profileService, 'getProfile').mockResolvedValueOnce({
      id: baseResponse.user_id,
      user_id: baseResponse.user_id,
      username: baseResponse.username,
      avatar_url: 'https://cdn/avatar.png',
      coins: baseResponse.coins,
      created_at: baseResponse.created_at,
      updated_at: baseResponse.updated_at,
      preferences: {
        sound: true,
        music: true,
        notifications: true,
        reduced_motion: false,
        high_contrast: false,
      },
    });

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const result = await profileService.updateAvatar(mockUserId, file);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/profiles/me/avatar',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(getProfileSpy).toHaveBeenCalled();
    expect(result.avatar_url).toBe('https://cdn/avatar.png');

    getProfileSpy.mockRestore();
  });

  test('updateProfile forwards updates payload and returns transformed profile', async () => {
    const updatedResponse = {
      ...baseResponse,
      username: 'updatedName',
      updated_at: new Date().toISOString(),
    };

    mockApiRequest.mockResolvedValueOnce(updatedResponse);

    const result = await profileService.updateProfile(mockUserId, { username: updatedResponse.username });

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/profiles/me',
      expect.objectContaining({
        method: 'PUT',
      }),
    );

    const [, options] = mockApiRequest.mock.calls[0];
    expect(JSON.parse((options as Record<string, unknown>).body as string)).toMatchObject({
      username: updatedResponse.username,
    });

    expect(result).toMatchObject({
      username: updatedResponse.username,
      updated_at: updatedResponse.updated_at,
    });
  });
});

