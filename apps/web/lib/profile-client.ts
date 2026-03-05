import { ApiError, UserRole } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type ProfileResponse = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  candidate: {
    phone: string | null;
    location: Record<string, unknown> | null;
    bio: string | null;
  } | null;
};

async function apiRequest<T>(
  token: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message[0]
          : 'Request failed';
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export function getMyProfile(token: string) {
  return apiRequest<ProfileResponse>(token, '/profile', { method: 'GET' });
}

export function updateMyProfile(
  token: string,
  payload: {
    name?: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    location?: Record<string, unknown>;
  },
) {
  return apiRequest<ProfileResponse>(token, '/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
