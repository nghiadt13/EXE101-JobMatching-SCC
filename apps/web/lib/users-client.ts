import { ApiError, UserRole } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  planName: string;
  lastLoginAt: string | null;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminUserCv = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  source: string;
  isPrimary: boolean;
  createdAt: string;
};

export type AdminTransaction = {
  id: string;
  amount: number;
  planName: string | null;
  orderCode: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  planName: string;
  createdAt: string;
  lastLoginAt: string | null;
  totalUsageDays: number;
  cvs: AdminUserCv[];
  transactions: AdminTransaction[];
};

export type UsersListResponse = {
  items: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
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

export function getUsers(
  token: string,
  query?: { page?: number; role?: UserRole; search?: string; limit?: number },
) {
  const params = new URLSearchParams();
  params.set('page', String(query?.page ?? 1));
  params.set('limit', String(query?.limit ?? 20));
  if (query?.role) {
    params.set('role', query.role);
  }
  if (query?.search) {
    params.set('search', query.search);
  }

  return apiRequest<UsersListResponse>(token, `/users?${params.toString()}`, {
    method: 'GET',
  });
}

export function updateUserByAdmin(
  token: string,
  userId: string,
  payload: { name: string; role: UserRole; avatar?: string },
) {
  return apiRequest<AdminUser>(token, `/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteUserByAdmin(token: string, userId: string) {
  return apiRequest<{ success: true }>(token, `/users/${userId}`, {
    method: 'DELETE',
  });
}

export function getUserDetail(token: string, userId: string) {
  return apiRequest<AdminUserDetail>(token, `/users/${userId}/detail`, {
    method: 'GET',
  });
}
