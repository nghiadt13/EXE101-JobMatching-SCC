import { ApiError } from './api-client';

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

export type PaymentLinkResponse = {
  checkoutUrl: string;
  orderCode: number;
  simulated: boolean;
  error?: string;
};

export type PaymentVerifyResponse = {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    planName: string;
  };
  message?: string;
};

export function createPaymentLink(token: string, amount: number) {
  return apiRequest<PaymentLinkResponse>(token, '/payment/create-link', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export function verifyPayment(token: string, orderCode: number, simulated?: boolean) {
  return apiRequest<PaymentVerifyResponse>(token, '/payment/verify', {
    method: 'POST',
    body: JSON.stringify({ orderCode, simulated }),
  });
}
