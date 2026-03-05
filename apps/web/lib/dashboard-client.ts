import { ApiError } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type CandidateDashboardStats = {
  totalApplications: number;
  pendingApplications: number;
  interviewCount: number;
};

export type RecruiterDashboardStats = {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingReview: number;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalRecruiters: number;
  totalCandidates: number;
  totalJobs: number;
  totalApplications: number;
};

export type DashboardStatsResponse =
  | CandidateDashboardStats
  | RecruiterDashboardStats
  | AdminDashboardStats;

export async function getDashboardStats(
  token: string,
): Promise<DashboardStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
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

  return body as DashboardStatsResponse;
}