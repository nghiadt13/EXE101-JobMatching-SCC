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
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    public readonly status: number,
    options?: {
      code?: string;
      requestId?: string;
      details?: unknown;
    },
  ) {
    super(message);
    this.code = options?.code;
    this.requestId = options?.requestId;
    this.details = options?.details;
  }
}

type ApiErrorBody = {
  message?: string | string[];
  code?: string;
  requestId?: string;
  details?: unknown;
};

export function createApiError(
  status: number,
  body: ApiErrorBody | null,
): ApiError {
  const message =
    typeof body?.message === 'string'
      ? body.message
      : Array.isArray(body?.message)
        ? body.message[0] ?? 'Request failed'
        : 'Request failed';

  return new ApiError(message, status, {
    code: body?.code,
    requestId: body?.requestId,
    details: body?.details,
  });
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
    | ApiErrorBody
    | null;

  if (!response.ok) {
    throw createApiError(response.status, body);
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
