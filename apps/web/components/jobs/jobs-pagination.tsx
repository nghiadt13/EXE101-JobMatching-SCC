import Link from 'next/link';
import { buildJobsSearchParams, type JobsQuery } from '@/lib/jobs-client';
import { Button } from '@/components/ui/button';
import { PUBLIC_JOBS_LISTING_ROUTE } from '@/lib/routes';

type JobsPaginationProps = {
  page: number;
  totalPages: number;
  query: JobsQuery;
};

function buildPageHref(query: JobsQuery, page: number) {
  const params = buildJobsSearchParams({ ...query, page });
  return params.size ? `${PUBLIC_JOBS_LISTING_ROUTE}?${params.toString()}` : PUBLIC_JOBS_LISTING_ROUTE;
}

export function JobsPagination({ page, totalPages, query }: JobsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Jobs pagination">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={buildPageHref(query, prevPage)}>Previous</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}
      <p className="text-sm text-zinc-600">
        Page {page} / {totalPages}
      </p>
      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={buildPageHref(query, nextPage)}>Next</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      )}
    </nav>
  );
}
