export interface CandidateDashboardStats {
  totalApplications: number;
  pendingApplications: number;
  interviewCount: number;
}

export interface RecruiterDashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingReview: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalRecruiters: number;
  totalCandidates: number;
  totalJobs: number;
  totalApplications: number;
}

export type DashboardStatsResponse =
  | CandidateDashboardStats
  | RecruiterDashboardStats
  | AdminDashboardStats;
