const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
  
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: string;
  metadata: any | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsListResponse = {
  items: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getNotifications(
  token: string,
  params?: { page?: number; limit?: number },
): Promise<NotificationsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  return apiRequest<NotificationsListResponse>(token, `/notifications?${searchParams.toString()}`, {
    method: 'GET',
    next: { revalidate: 0 },
  });
}

export async function markNotificationAsRead(token: string, id: string): Promise<void> {
  await apiRequest<void>(token, `/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(token: string): Promise<void> {
  await apiRequest<void>(token, `/notifications/read-all`, {
    method: 'PATCH',
  });
}
