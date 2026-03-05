export type UserRole = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

export type AuthApiResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token: string;
  accessToken?: string;
  expiresIn?: number;
};

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  role: Extract<UserRole, 'CANDIDATE' | 'RECRUITER'>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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

export function loginWithCredentials(email: string, password: string) {
  return apiRequest<AuthApiResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser(payload: RegisterPayload) {
  return apiRequest<AuthApiResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
