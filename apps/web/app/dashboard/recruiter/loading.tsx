import { DashboardStatCardSkeleton } from '@/components/dashboard/dashboard-stat-card';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCardSkeleton />
        <DashboardStatCardSkeleton />
        <DashboardStatCardSkeleton />
        <DashboardStatCardSkeleton />
      </div>
    </main>
  );
}