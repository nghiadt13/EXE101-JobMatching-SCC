import type { CvBuilderData } from '@/types/cv-builder';

/**
 * Lightweight REST client for the `PUT /cvs/:id/builder` endpoint, designed for
 * browser use by the auto-save hook (`useAutoSave`).
 *
 * Unlike the Server-Action-bound `updateBuilderCv` in `lib/cv-client.ts`
 * (which returns the full `CvItem` and is paired with `revalidatePath`),
 * this client:
 *   - runs from the browser via `fetch` (no Server Action wrapper),
 *   - returns only `{ ok: true }` JSON to keep auto-save payloads small,
 *   - throws a plain `Error` (`[<status>] <message>`) on 4xx / 5xx.
 *
 * Validates: Requirements 6.3, 6.8, 11.6.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type ApiErrorBody = {
  message?: string | string[];
  code?: string;
};

export async function updateBuilderCv(
  cvId: string,
  token: string,
  data: CvBuilderData,
): Promise<{ ok: true }> {
  const response = await fetch(`${API_BASE_URL}/cvs/${cvId}/builder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | ApiErrorBody
      | null;

    const rawMessage = body?.message;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage)
          ? rawMessage[0] ?? 'Request failed'
          : 'Request failed';

    throw new Error(`[${response.status}] ${message}`);
  }

  return { ok: true };
}
