'use client';

import { Users, GraduationCap, UserCheck, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';

type StatsCardProps = {
  label: string;
  count: number;
  trend?: string;
  icon: React.ReactNode;
  iconBg: string;
};

function StatsCard({ label, count, trend, icon, iconBg }: StatsCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <span className="block text-xs font-medium text-zinc-500">{label}</span>
        <span className="mt-1 block text-2xl font-bold text-zinc-900">{count}</span>
        {trend ? (
          <span className="mt-1 flex items-center text-[11px] font-medium text-emerald-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            {trend}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl text-lg',
          iconBg,
        )}
      >
        {icon}
      </div>
    </div>
  );
}

type AdminUsersStatsProps = {
  totalUsers: number;
  candidates: number;
  recruiters: number;
  admins: number;
};

export function AdminUsersStats({
  totalUsers,
  candidates,
  recruiters,
  admins,
}: AdminUsersStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        label="Tổng người dùng"
        count={totalUsers}
        trend="+12% tháng này"
        icon={<Users className="h-5 w-5" />}
        iconBg="bg-blue-50 text-blue-600"
      />
      <StatsCard
        label="Candidate (Ứng viên)"
        count={candidates}
        icon={<GraduationCap className="h-5 w-5" />}
        iconBg="bg-emerald-50 text-emerald-600"
      />
      <StatsCard
        label="Recruiter (Tuyển dụng)"
        count={recruiters}
        icon={<UserCheck className="h-5 w-5" />}
        iconBg="bg-amber-50 text-amber-600"
      />
      <StatsCard
        label="Admin (Quản trị)"
        count={admins}
        icon={<Shield className="h-5 w-5" />}
        iconBg="bg-purple-50 text-purple-600"
      />
    </div>
  );
}
